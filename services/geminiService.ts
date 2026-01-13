
import { GoogleGenAI, Type } from "@google/genai";
import { MaintenanceItem } from "../types";

/**
 * Utility function for retrying API calls with exponential backoff.
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  onRetry?: (count: number) => void,
  maxRetries = 3
): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = (error as any)?.status;
      if (status === 429 || (status >= 500 && status < 600)) {
        if (onRetry) onRetry(i + 1);
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

export const getMaintenanceAdvice = async (items: MaintenanceItem[], onRetry?: (count: number) => void) => {
  // Always initialize with the exact environment variable as per SDK instructions
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const simplifiedData = items.map(i => ({
    item: i.item,
    cycle: i.cycleYears,
    nextYear: i.nextRepairYear,
    cost: i.estimatedCost
  })).slice(0, 40);

  const prompt = `
    당신은 대한민국 아파트 장기수선계획 수립 전문가입니다.
    다음 데이터를 바탕으로 관리소장에게 보고할 수 있는 전략 요약 리포트를 작성하세요.
    
    데이터: ${JSON.stringify(simplifiedData)}
    
    가이드라인:
    - 향후 5년 내 예산이 집중되는 연도와 대응 방안.
    - 수선 주기가 누락되거나 부적절해 보이는 핵심 항목 지적.
    - 수선유지비 절감을 위한 전략적 조언.
    
    답변은 정중하고 신뢰감 있는 한국어로 작성해 주세요.
  `;

  return await retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  }, onRetry);
};

export const validatePlanWithAI = async (items: MaintenanceItem[], onRetry?: (count: number) => void) => {
  // Always initialize with the exact environment variable as per SDK instructions
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  return await retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `다음 아파트 수선 데이터를 검토하고 결과만 JSON 배열로 반환하세요: ${JSON.stringify(items.slice(0, 10))}. itemName, reason, complianceNote, recommendedYear 포함.`,
      config: {
        responseMimeType: "application/json",
        // Enable thinking for complex reasoning tasks as per Gemini 3 series guidelines
        thinkingConfig: { thinkingBudget: 4096 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING },
              reason: { type: Type.STRING },
              complianceNote: { type: Type.STRING },
              recommendedYear: { type: Type.NUMBER }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  }, onRetry);
};
