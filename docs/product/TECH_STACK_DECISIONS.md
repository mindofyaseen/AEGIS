# AEGIS — Technology Stack Architectural Decisions

## 1. Architectural Principles
AEGIS was architected according to four core technical criteria:
1. **Mathematical Determinism:** Critical security evaluations must be reproducible and provable.
2. **Zero Blast Radius:** The agent must never possess destructive or mutating capabilities.
3. **Execution Speed:** Full graph modeling and attack path analysis must finish in seconds.
4. **AWS Native Integration:** Direct utilization of Amazon Bedrock Managed Agents (AgentCore) and Boto3.

---

## 2. Technology Selection Matrix

| Component | Technology Chosen | Alternatives Considered | Justification |
| :--- | :--- | :--- | :--- |
| **Agent Foundation** | **Amazon Bedrock AgentCore** | LangChain, CrewAI, AutoGen | Managed AWS infrastructure, secure tool invocation boundaries, direct Bedrock Foundation Model integration. |
| **Reasoning Model** | **Anthropic Claude 3.5 Sonnet / Haiku (via Bedrock)** | Llama 3 70B, Amazon Titan | Superior code diff synthesis, exceptional structured JSON reasoning, high fidelity compliance analysis. |
| **Knowledge Graph** | **NetworkX (In-Memory MultiDiGraph)** | Neo4j, Amazon Neptune | Zero operational overhead, millisecond path traversal, zero AWS hosting cost ($0.00 spent), seamless portability. |
| **Backend API** | **FastAPI + Uvicorn (Python 3.12)** | Flask, Django, Node.js Express | High-performance asynchronous execution, automatic OpenAPI schema generation, native Pydantic contract integration. |
| **Data Contracts** | **Pydantic v2** | Marshmallow, dataclasses | Strict runtime validation, high serialization performance (compiled Rust core), immutable schema enforcement. |
| **Frontend UI** | **React 18 + TypeScript + Vite + Tailwind CSS** | Next.js, Vue, Angular | Instant development velocity, sub-300ms hot reload, clean standalone SPA bundle buildable into FastAPI static files. |
| **Icons & Visuals** | **Lucide React + SVG Canvas** | Three.js, Cytoscape.js | Ultra-lightweight bundle size (<250 kB), crisp vector scaling, zero heavy WebGL dependencies, rapid rendering. |
| **Test Framework** | **Pytest + Pytest-Asyncio** | Unittest, Nose | Rich parameterized test fixtures, native async test support, clear assertion diffs for adversarial testing. |

---

## 3. Knowledge Graph Engine Rationale: In-Memory vs Managed Neptune
While Amazon Neptune is an exceptional enterprise managed graph database, using Neptune for local development or hackathon staging introduces:
- A minimum continuous cluster cost of ~$75+/month.
- VPC peering and bastion access latency.
- Unnecessary complexity for single-account snapshot correlation.

By implementing `InfrastructureGraphEngine` using **NetworkX MultiDiGraph**:
1. All graph construction and BFS attack path algorithms execute in **< 15 milliseconds**.
2. AWS spend remains strictly at **$0.00**, completely preserving founder credits.
3. Graph serialization to Cytoscape-compatible JSON is instantaneous.
4. Seamless future migration: NetworkX graph structures can be exported to OpenCypher or Gremlin queries for Neptune in Phase 2 with zero changes to business logic.
