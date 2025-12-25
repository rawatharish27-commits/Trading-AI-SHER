import { DecisionState, AISignal } from '../../types';

export class StateFlowProcessor {
  static async run(initialSignal: AISignal, steps: (() => Promise<void>)[]): Promise<AISignal> {
    const signal = { ...initialSignal };
    
    try {
        for (const step of steps) {
            await step();
        }
        signal.decisionState = DecisionState.DISPATCH_READY;
    } catch (e: any) {
        signal.decisionState = DecisionState.REJECTED;
        signal.reasoning = `REJECT_REASON: ${e.message}`;
    }

    return signal;
  }
}