
import { ModelMetadata } from '../../types';

class ModelGovernance {
  private static readonly STORAGE_KEY = 'sher_model_registry';
  
  private registry: ModelMetadata[] = [
    {
      id: 'ensemble-core-v4',
      version: '4.2.1-stable',
      architecture: 'Hybrid LSTM + XGBoost + Gemini Ensemble',
      trainedOn: 'Jan 2024 - Dec 2024',
      featureHash: 'sha256-8x72f1a...',
      status: 'PRODUCTION',
      lastValidated: new Date().toISOString()
    },
    {
      id: 'sentiment-shard-v1',
      version: '1.0.4-canary',
      architecture: 'NLP Transformer (Llama-3 Shard)',
      trainedOn: 'Continuous',
      featureHash: 'sha256-4291b7x...',
      status: 'CANARY',
      lastValidated: new Date().toISOString()
    }
  ];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(ModelGovernance.STORAGE_KEY);
    if (saved) this.registry = JSON.parse(saved);
  }

  getRegistry(): ModelMetadata[] {
    return this.registry;
  }

  rollout(id: string, version: string) {
    console.log(`🦁 [ModelGov] Initiating Rollout: ${id}@${version}`);
    // Rollout logic: update status and timestamp
    this.registry = this.registry.map(m => 
      m.id === id ? { ...m, version, lastValidated: new Date().toISOString() } : m
    );
    this.save();
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ModelGovernance.STORAGE_KEY, JSON.stringify(this.registry));
    }
  }
}

export const modelGovernance = new ModelGovernance();
