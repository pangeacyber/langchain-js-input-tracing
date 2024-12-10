import type { BaseMessage } from '@langchain/core/messages';
import { BaseTracer, type Run } from 'langchain/callbacks';
import { AuditService, PangeaConfig } from 'pangea-node-sdk';

/**
 * Tracer that creates an event in Pangea's Secure Audit Log when input for an
 * LLM is received.
 */
export class PangeaAuditCallbackHandler extends BaseTracer {
  name = 'pangea_audit_callback_handler';

  private client;

  constructor(
    token: string,
    configId?: string,
    domain = 'aws.us.pangea.cloud'
  ) {
    super();

    this.client = new AuditService(
      token,
      new PangeaConfig({ domain }),
      undefined,
      configId
    );
  }

  protected override persistRun(_run: Run): Promise<void> {
    return Promise.resolve();
  }

  override async onLLMStart(run: Run): Promise<void> {
    if (!run.inputs || !run.inputs.messages) {
      return;
    }

    await this.client.logBulk([
      {
        event_input: (run.inputs.messages as BaseMessage[][])
          .flat()
          .map(({ content }) => content),
        event_tools: run.name,
        event_type: 'inference:user_prompt',
      },
    ]);
  }
}
