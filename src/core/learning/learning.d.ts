declare module './extractor' {
  export class CandidateExtractor {
    extractCandidatesFromSignal(signal: any): Promise<any[]>;
    extractCandidatesFromMemoryEntries?(entries: any[]): Promise<any[]>;
  }
  export default CandidateExtractor;
}

declare module './validator' {
  export class CandidateValidator {
    validate(candidate: any): Promise<{ valid: boolean; score?: number; reasons?: string[] }>;
  }
  export default CandidateValidator;
}
