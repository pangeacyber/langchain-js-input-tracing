# Input Tracing for LangChain in JavaScript

An example JavaScript app that demonstrates integrating Pangea's
[Secure Audit Log][] service into a LangChain app to maintain an audit log of
context and prompts being sent to LLMs.

In this case, our topic context consists of articles about authentication from
our [Secure by Design Hub][] included in `data/`.

## Prerequisites

- Node.js v22.
- A [Pangea account][Pangea signup] with Secure Audit Log enabled with the
  AI Audit Log Schema Config.
- An [OpenAI API key][OpenAI API keys].

## Setup

```shell
git clone https://github.com/pangeacyber/langchain-js-input-tracing.git
cd langchain-js-input-tracing
npm install
cp .env.example .env
```

Fill in the values in `.env` and then the app can be run like so:

```shell
npm run demo -- --auditConfigId pci_0123456789 "What do you know about OAuth?"
```

_Note:_ Because our context is limited to the authentication articles mentioned
above, if you ask a question outside that context, you will get some variation
of "I don't know."

Sample output:

```
OAuth is an authorization framework that allows third-party services to exchange
limited access to user accounts without exposing user credentials. It focuses on
resource access and control, making it different from OpenID Connect (OIDC),
which is built on OAuth 2.0 and specializes in user authentication. Together,
OAuth 2.0 and OIDC provide a secure and standardized way for applications to
verify user identities while minimizing the handling of sensitive data.
```

[Secure Audit Log]: https://pangea.cloud/docs/audit/
[Secure by Design Hub]: https://pangea.cloud/securebydesign/
[Pangea signup]: https://pangea.cloud/signup
[OpenAI API keys]: https://platform.openai.com/api-keys
