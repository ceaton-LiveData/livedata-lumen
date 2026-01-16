# Lumen - AI-Powered Block Utilization Assistant

## Executive Summary

Lumen is an AI-powered chat assistant that helps perioperative staff analyze OR block utilization data through natural language conversations. Instead of navigating complex dashboards and reports, users can simply ask questions like "Which surgeons have the lowest block utilization this month?" and receive instant, actionable insights.

**Current Status:** POC complete with stubbed data, awaiting Insights API connectivity

**Live Demo:** https://68vetiq5cz.us-east-1.awsapprunner.com

---

## Problem Statement

Perioperative leaders spend significant time navigating dashboards and manually correlating data to answer questions about block utilization. Common pain points:

- Multiple clicks to drill down into utilization data
- Manual correlation across different views (by surgeon, by service line, by date)
- No easy way to ask ad-hoc questions
- Reports require export and manual analysis

## Solution

Lumen provides a conversational interface that:

1. Understands natural language questions about block utilization
2. Automatically calls the right APIs to gather data
3. Synthesizes information from multiple sources
4. Presents clear, actionable answers

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    (Chat UI / Admin Dashboard)                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Express.js Server                         │
│                     (src/server.ts)                             │
│  • POST /chat - Handle user messages                            │
│  • GET /admin/* - Usage tracking & monitoring                   │
│  • Serves static UI files                                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Agent Loop                               │
│                   (src/agent/loop.ts)                           │
│  • Sends messages to Claude via AWS Bedrock                     │
│  • Handles tool calls in a loop until complete                  │
│  • Tracks token usage for cost monitoring                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│      AWS Bedrock          │   │        MCP Server             │
│   Claude Sonnet 4.5       │   │    (src/mcp/server.ts)        │
│                           │   │                               │
│  • Understands questions  │   │  • Exposes tools via MCP      │
│  • Decides which tools    │   │  • Executes tool calls        │
│    to call                │   │  • Returns structured data    │
│  • Generates responses    │   │                               │
└───────────────────────────┘   └───────────────────────────────┘
                                              │
                                              ▼
                                ┌───────────────────────────────┐
                                │         Tools                 │
                                │   (src/mcp/tools/*.ts)        │
                                │                               │
                                │  • block_util_summary         │
                                │  • block_util_by_block_group  │
                                │  • block_util_by_surgeon      │
                                │  • block_util_drill_down      │
                                │                               │
                                │  Currently: Stubbed data      │
                                │  Future: Insights API calls   │
                                └───────────────────────────────┘
```

---

## Key Technical Decisions

### 1. AWS Bedrock (not direct Anthropic API)

**Decision:** Use AWS Bedrock to access Claude models

**Rationale:**
- LiveData already has AWS infrastructure and IAM policies
- Bedrock handles authentication via IAM roles (no API keys to manage)
- Data stays within AWS (important for healthcare compliance)
- Consistent billing through existing AWS account
- Can switch models easily (Claude Sonnet, Haiku, etc.)

**Trade-off:** Slightly higher latency vs direct API, but security and compliance benefits outweigh this.

### 2. Model Context Protocol (MCP) for Tools

**Decision:** Use Anthropic's MCP standard for tool definitions

**Rationale:**
- Industry-standard protocol for LLM tool use
- Clean separation between agent logic and tool implementations
- Tools can be developed and tested independently
- Future-proof: MCP is being adopted across the industry
- Allows tools to be exposed to other MCP clients if needed

**Trade-off:** Adds complexity of running MCP server as subprocess, but provides cleaner architecture.

### 3. TypeScript Tool Definitions (not YAML)

**Decision:** Define tools in TypeScript code

**Rationale:**
- Type safety catches errors at compile time
- Single language for the entire project
- Tool implementations require code anyway
- Simpler initial implementation

**Future consideration:** May add YAML-based tool definitions to allow non-developers to create tools that call HTTP APIs. See TODO.md for details.

### 4. Dashboard Manifests for Tool Filtering

**Decision:** JSON manifest files define which tools are available per dashboard

**Rationale:**
- Different dashboards have different data needs
- Limits tool scope to reduce confusion and potential misuse
- Allows gradual rollout of tools per dashboard
- Non-developers can manage dashboard configurations

**Example:** `src/config/dashboards/block-utilization.json`
```json
{
  "id": "block-utilization",
  "name": "Block Utilization",
  "availableTools": [
    "block_util_summary",
    "block_util_by_block_group",
    "block_util_by_surgeon",
    "block_util_drill_down"
  ]
}
```

### 5. In-Memory Usage Tracking (for POC)

**Decision:** Track usage and costs in memory, not a database

**Rationale:**
- Simplifies POC deployment (no database setup)
- Sufficient for demo and initial testing
- Data persists for lifetime of server process
- Easy to swap for database later (Supabase, DynamoDB)

**Trade-off:** Data is lost on server restart. Production deployment should use persistent storage.

### 6. AWS App Runner for Deployment

**Decision:** Deploy on AWS App Runner

**Rationale:**
- Simple deployment from GitHub (push to deploy)
- Auto-scaling built in
- No container orchestration to manage
- Integrates with existing AWS IAM for Bedrock access
- Cost-effective for variable workloads

---

## Current Capabilities

### What Works Today

| Feature | Status | Notes |
|---------|--------|-------|
| Chat UI | ✅ Complete | Dark theme, shows tool calls |
| Admin Dashboard | ✅ Complete | Usage stats, cost tracking, logs |
| Agent Loop | ✅ Complete | Multi-turn tool calling |
| Tool Definitions | ✅ Complete | 4 block utilization tools |
| Dashboard Filtering | ✅ Complete | Tools filtered by dashboard |
| Usage Tracking | ✅ Complete | In-memory, tracks costs |
| AWS Deployment | ✅ Complete | App Runner auto-deploy |

### What's Stubbed

| Feature | Status | Blocker |
|---------|--------|---------|
| Insights API Integration | 🔶 Stubbed | Awaiting API access |
| Real Data | 🔶 Stubbed | Depends on API integration |

---

## Tools Inventory

### block_util_summary
**Purpose:** Get high-level utilization metrics for a date range

**Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format

**Returns:** Total blocks, utilized blocks, utilization rate, prime time utilization, case counts

### block_util_by_block_group
**Purpose:** Break down utilization by service line or block group

**Parameters:**
- `start_date` (required): Start date
- `end_date` (required): End date
- `location` (optional): Filter by location

**Returns:** Per-group metrics including blocks, utilization rate, case counts

### block_util_by_surgeon
**Purpose:** Break down utilization by individual surgeon

**Parameters:**
- `start_date` (required): Start date
- `end_date` (required): End date
- `blockgroup` (optional): Filter by block group/service line

**Returns:** Per-surgeon metrics including utilization rate, case counts, avg case duration

### block_util_drill_down
**Purpose:** Get detailed block-level data for specific analysis

**Parameters:**
- `start_date` (required): Start date
- `end_date` (required): End date
- `surgeon` (optional): Filter by surgeon
- `blockgroup` (optional): Filter by block group

**Returns:** Individual block records with scheduling details, in-block/out-of-block time

---

## Cost Model

### Claude Sonnet 4.5 Pricing (via Bedrock)
- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens

### Estimated Costs Per Query
- Simple question (no tools): ~$0.001-0.002
- Question with 1-2 tool calls: ~$0.003-0.005
- Complex multi-tool query: ~$0.008-0.015

### Cost Controls (Planned)
- Rate limiting per IP/session
- Daily cost caps
- Usage alerts via admin dashboard

---

## Platform Vision

Lumen is not just a chatbot - it's an **intelligent perioperative platform**. The chat interface is one entry point, but the same agent core will power multiple capabilities:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LUMEN PLATFORM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Chat UI   │  │  Proactive  │  │  Optimizer  │  │  Embedded   │        │
│  │  (current)  │  │   Alerts    │  │   Service   │  │  Widget API │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│         └────────────────┴────────────────┴────────────────┘               │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        AGENT CORE                                    │   │
│  │  - Understands perioperative domain                                  │   │
│  │  - Same tools, same knowledge, different triggers                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     MCP TOOLS + MANIFESTS                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Planned Capabilities

| Capability | Trigger | Output | Use Case |
|------------|---------|--------|----------|
| **Chat** | User message | Response in UI | Ad-hoc questions, analysis |
| **Proactive Alerts** | Scheduled job or event stream | Email/SMS/push notification | "Case running late, recommend moving OR 3 cases" |
| **Optimizer** | API call from scheduler app | JSON recommendations | "Reallocate blocks to improve utilization" |
| **Embedded Widget** | API call from other LiveData apps | Contextual insights | Surgeon sees utilization tips on their schedule |

### Event-Driven Example: Case Delay Alert

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EVENT: Case duration exceeds predicted time by 30+ minutes                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  AGENT TRIGGERED                                                            │
│  Context: Current case, predicted vs actual end time, downstream cases      │
│  Task: "Assess impact and recommend actions"                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  AGENT CALLS TOOLS                                                          │
│  1. get_or_schedule(date, location)                                         │
│  2. get_available_ors(time_range)                                           │
│  3. get_case_flexibility(case_ids)                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  AGENT DECISION + NOTIFICATION                                              │
│                                                                             │
│  To: Charge Nurse                                                           │
│  "Dr. Chen's case running 90min over. Recommend:                            │
│   1. Move C-456 to OR 7 (available) - RECOMMENDED                           │
│   2. Delay C-456 and C-789 by 90min - impacts 2 patients"                   │
│                                                                             │
│  Actions: [Approve Move] [Delay Instead] [Dismiss]                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Architecture Implications

The current POC architecture supports this vision:

1. **Agent Loop** - Already abstracted, can be triggered by any source
2. **Tools** - Portable, same tools work for all triggers
3. **Manifests** - Can define event triggers in addition to available tools
4. **Site Config** - Per-client notification preferences, alert thresholds
5. **Training Data Pipeline** - Usage tracking captures query→tool mappings for future SLM training

### Strategic IP: Domain-Specific Intelligence

A key long-term differentiator is the ability to train a **Perioperative SLM** (Small Language Model) on real query patterns. The current architecture intentionally captures training data:

| Data Captured | Purpose |
|--------------|---------|
| Query text | What users actually ask about perioperative data |
| Selected tools | Which tools answer which types of questions |
| Tool parameters | How to extract dates, surgeon names, metrics from queries |
| Response patterns | What makes a good vs poor response |

**Why this matters:** After sufficient query volume, we can fine-tune a small model that:
- Routes 80%+ of queries without needing Sonnet (cost reduction)
- Understands perioperative vocabulary natively (better accuracy)
- Runs faster than full Sonnet inference (latency improvement)
- Could run on-premises for sensitive deployments (compliance)

This creates a competitive moat - the domain-specific intelligence improves with usage and cannot be easily replicated without similar data.

Future manifest additions for event-driven triggers:
```json
{
  "id": "schedule-monitor",
  "triggers": {
    "case_delay": {
      "condition": "case.estimated_end > case.predicted_end + 30min",
      "task": "Assess schedule impact and recommend actions",
      "notify": ["charge_nurse"],
      "priority": "high"
    }
  }
}
```

---

## Roadmap

### Phase 1: POC (Current)
- [x] Core agent architecture
- [x] Chat UI
- [x] Admin dashboard with usage tracking
- [x] Stubbed tools for block utilization
- [x] AWS deployment

### Phase 2: API Integration
- [ ] Connect tools to Insights APIs
- [ ] Handle authentication/authorization
- [ ] Error handling and retries
- [ ] Real data validation

### Phase 3: Production Readiness
- [ ] Conversation history (multi-turn memory)
- [ ] Rate limiting
- [ ] Security hardening (input validation, audit logging)
- [ ] Persistent usage storage

### Phase 4: Platform Expansion
- [ ] Event-driven triggers (proactive alerts)
- [ ] Optimizer API endpoint
- [ ] Embedded widget API for other LiveData apps
- [ ] Notification service (email, SMS, push)

### Phase 5: Enhanced UX
- [ ] Response streaming
- [ ] Additional dashboard support
- [ ] YAML-based tool definitions for non-developers
- [ ] Domain knowledge in manifests (metric definitions, targets)

### Phase 6: Domain Intelligence (V2+)
- [ ] Query pattern analysis and tooling
- [ ] Training data export pipeline
- [ ] Perioperative SLM fine-tuning for tool routing
- [ ] Hybrid SLM/Sonnet architecture (SLM routes, Sonnet reasons)
- [ ] On-premises SLM deployment option for sensitive sites

See [TODO.md](TODO.md) for detailed implementation plans for each item.

---

## Security Considerations

### Current State
- Tools are read-only
- Data is stubbed (no real patient/PHI data)
- No authentication (open access for demo)

### Before Production
1. **Input validation** - Block prompt injection attempts
2. **Output filtering** - Prevent accidental data leaks
3. **Audit logging** - Track all queries and tool calls
4. **Authentication** - Integrate with LiveData SSO
5. **Rate limiting** - Prevent abuse and cost overruns

See Security Hardening section in [TODO.md](TODO.md) for full details.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start development server (port 3001)
npm start

# Build for production
npm run build

# Start production server
npm run start:prod
```

**Requirements:**
- Node.js 18+
- AWS credentials configured with Bedrock access

---

## Deployment

The application auto-deploys to AWS App Runner when code is pushed to the `main` branch.

**App Runner Configuration:**
- Runtime: Node.js 18
- Build: `npm install && npm run build`
- Start: `npm run start:prod`
- Port: 3000

**Required AWS Permissions:**
- `bedrock:InvokeModel` for Claude Sonnet 4.5

---

## Key Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Express server, API endpoints |
| `src/agent/loop.ts` | Agent loop, Bedrock integration |
| `src/agent/prompts.ts` | System prompt for Claude |
| `src/mcp/server.ts` | MCP server exposing tools |
| `src/mcp/client.ts` | MCP client connecting to server |
| `src/mcp/tools/*.ts` | Individual tool implementations |
| `src/config/dashboards/*.json` | Dashboard manifests |
| `src/services/usage-tracker.ts` | Cost and usage tracking |
| `ui/index.html` | Chat interface |
| `ui/admin.html` | Admin dashboard |
| `TODO.md` | Detailed enhancement plans |

---

## Questions?

For technical questions about this POC, refer to:
- This document for architecture and decisions
- [TODO.md](TODO.md) for planned enhancements
- The codebase in `src/` for implementation details
