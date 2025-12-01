import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry, AnalysisSummary, CostReport } from "../types";

// Helper to get AI instance
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Gemini Service: API_KEY is missing from process.env. The app may fail to generate content.");
  } else {
    // Log presence only (security best practice)
    console.log("Gemini Service: API_KEY loaded successfully from environment.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Generates synthetic log data for demonstration purposes.
 */
export const generateDemoLogs = async (): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Generate a realistic block of 25-30 raw log lines from a hypothetical Google Cloud environment.
    Include a mix of services like 'gke-cluster-1', 'cloud-sql-db', 'loadbalancer-frontend', and 'backend-api'.
    Include timestamps (recent ISO dates).
    Include a mix of severities: INFO, WARNING, and at least 3-4 ERROR/CRITICAL logs related to a database connection timeout or high latency.
    Format them as standard text logs (not JSON), similar to what one sees in a terminal or Stackdriver console.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
};

/**
 * Parses raw text logs into structured JSON data.
 */
export const parseLogs = async (rawLogs: string): Promise<LogEntry[]> => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
      Parse the following raw log text into a structured JSON array.
      Extract the timestamp (convert to ISO string), severity (uppercase), service name, and the log message.
      If severity is missing, infer it from the message (default to INFO).
      
      Raw Logs:
      ${rawLogs}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            timestamp: { type: Type.STRING },
            severity: { type: Type.STRING }, // Will cast to enum later
            service: { type: Type.STRING },
            message: { type: Type.STRING },
          },
          required: ["timestamp", "severity", "service", "message"],
        },
      },
    },
  });

  if (!response.text) return [];
  
  try {
    const data = JSON.parse(response.text);
    return data as LogEntry[];
  } catch (e) {
    console.error("Failed to parse logs", e);
    return [];
  }
};

/**
 * Fetches logs directly from Google Cloud Logging API using a user-provided access token.
 */
export const fetchGCPLogs = async (projectId: string, accessToken: string): Promise<LogEntry[]> => {
  try {
    const response = await fetch(`https://logging.googleapis.com/v2/entries:list`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resourceNames: [`projects/${projectId}`],
        orderBy: "timestamp desc",
        pageSize: 50
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GCP API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    if (!data.entries) return [];

    // Map GCP specific format to our generic LogEntry
    return data.entries.map((entry: any) => {
        let message = "No message content";
        if (entry.textPayload) message = entry.textPayload;
        else if (entry.jsonPayload) message = JSON.stringify(entry.jsonPayload);
        
        // Attempt to resolve a meaningful service name from resources or labels
        const service = entry.resource?.labels?.module_id || 
                        entry.resource?.labels?.service_name || 
                        entry.resource?.labels?.cluster_name ||
                        entry.resource?.type || 
                        "gcp-service";

        return {
            timestamp: entry.timestamp,
            severity: entry.severity || "INFO",
            service: service,
            message: message,
            traceId: entry.trace
        };
    });
  } catch (error) {
    console.error("Failed to fetch from GCP", error);
    throw error;
  }
};

/**
 * Generates an executive summary report based on structured logs.
 */
export const generateReport = async (logs: LogEntry[]): Promise<AnalysisSummary> => {
  const ai = getAI();
  const logContext = JSON.stringify(logs.slice(0, 100)); // Send first 100 for context to avoid token limits on huge sets

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
      Analyze these structured logs and provide a system health report.
      
      Logs:
      ${logContext}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING, description: "A brief paragraph summarizing the system state." },
          criticalIssues: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of critical errors or patterns detected." 
          },
          recommendations: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Actionable steps to resolve issues." 
          }
        },
        required: ["overview", "criticalIssues", "recommendations"],
      }
    },
  });

  if (!response.text) {
    return {
      overview: "Could not generate report.",
      criticalIssues: [],
      recommendations: []
    };
  }

  try {
    return JSON.parse(response.text) as AnalysisSummary;
  } catch (e) {
    console.error("Failed to parse report", e);
    return {
      overview: "Error parsing AI response.",
      criticalIssues: [],
      recommendations: []
    };
  }
};

export type ProjectScale = 'hobby' | 'startup' | 'enterprise';

/**
 * Generates a mock cost analysis report based on the Project ID context and scale.
 */
export const generateCostReport = async (projectId: string, scale: ProjectScale = 'hobby'): Promise<CostReport> => {
  const ai = getAI();
  
  let promptContext = "";
  if (scale === 'hobby') {
    promptContext = `
      This is a small personal/developer project (like a free tier or minimal usage setup). 
      Total monthly costs should be very low (e.g., between €0.00 and €10.00).
      Services should be things like Cloud Run (low invocation), Cloud Storage (small), or free tier Compute Engine.
      Currency should be EUR (€).
      FinOps score should be high (4-5) as waste is low.
    `;
  } else if (scale === 'startup') {
    promptContext = `
      This is a startup production environment. 
      Total monthly costs should be moderate (e.g., €100 - €500).
      Stack includes Managed SQL, Load Balancers, and a few VMs.
      Currency EUR (€).
    `;
  } else {
    promptContext = `
      This is a large enterprise environment.
      Total monthly costs are high (€2,000+).
      Complex stack with GKE, Dataflow, BigQuery.
      Currency EUR (€).
    `;
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
      Generate a simulated monthly cost report for Google Cloud Project "${projectId}".
      ${promptContext}
      
      Requirements:
      1. Create daily cost data for the last 14 days. For 'hobby', these should be tiny amounts (e.g. 0.01, 0.05).
      2. Create a service breakdown.
      3. Provide a 'finOpsScore' from 0 (poor) to 5 (excellent).
      4. Provide AI analysis and optimization tips relevant to this scale.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalMonthToDate: { type: Type.NUMBER },
          projectedEndOfMonth: { type: Type.NUMBER },
          dailyTrend: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                cost: { type: Type.NUMBER },
                currency: { type: Type.STRING }
              }
            }
          },
          serviceBreakdown: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                service: { type: Type.STRING },
                cost: { type: Type.NUMBER }
              }
            }
          },
          aiAnalysis: { type: Type.STRING },
          optimizationTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          finOpsScore: { type: Type.NUMBER, description: "Score from 0 to 5 reflecting cost efficiency" }
        },
        required: ["totalMonthToDate", "projectedEndOfMonth", "dailyTrend", "serviceBreakdown", "aiAnalysis", "optimizationTips"]
      }
    }
  });

  if (!response.text) throw new Error("Failed to generate cost report");
  return JSON.parse(response.text) as CostReport;
};