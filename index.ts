import process from 'node:process';

import { config } from '@dotenvx/dotenvx';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
} from '@langchain/core/prompts';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { defineCommand, runMain } from 'citty';
import { consola } from 'consola';

import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { PangeaAuditCallbackHandler } from './tracers/audit.js';

config({ override: true, quiet: true });

const prompt = ChatPromptTemplate.fromMessages([
  HumanMessagePromptTemplate.fromTemplate(`You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
Question: {input}
Context: {context}
Answer:`),
]);

const main = defineCommand({
  args: {
    prompt: { type: 'positional' },
    auditConfigId: {
      type: 'string',
      description: 'Pangea Secure Audit Log configuration ID.',
    },
    model: {
      type: 'string',
      default: 'gpt-4o-mini',
      description: 'OpenAI model.',
    },
  },
  async run({ args }) {
    const auditToken = process.env.PANGEA_AUDIT_TOKEN;
    if (!auditToken) {
      consola.warn('PANGEA_AUDIT_TOKEN is not set.');
      return;
    }

    const pangeaDomain = process.env.PANGEA_DOMAIN || 'aws.us.pangea.cloud';

    const loader = new DirectoryLoader('data', {
      '.md': (path) => new TextLoader(path),
    });
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 3500,
      chunkOverlap: 50,
    });
    const splits = await splitter.splitDocuments(docs);
    const vectorStore = await MemoryVectorStore.fromDocuments(
      splits,
      new OpenAIEmbeddings()
    );
    const retriever = vectorStore.asRetriever();

    const auditCallback = new PangeaAuditCallbackHandler(
      auditToken,
      args.auditConfigId,
      pangeaDomain
    );
    const llm = new ChatOpenAI({
      model: args.model,
      callbacks: [auditCallback],
    });
    const chain = await createStuffDocumentsChain({
      llm,
      prompt,
      outputParser: new StringOutputParser(),
    });

    consola.log(
      await chain.invoke({
        input: args.prompt,
        context: await retriever.invoke(args.prompt),
      })
    );
  },
});

runMain(main);
