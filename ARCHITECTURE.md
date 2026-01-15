# Lumen Architecture

## High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                                   USERS                                        │
│                    (Perioperative Staff, Analysts, Leaders)                    │
└────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                    │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐           │
│  │        Chat UI              │    │     Admin Dashboard         │           │
│  │    (ui/index.html)          │    │    (ui/admin.html)          │           │
│  │                             │    │                             │           │
│  │  • Natural language input   │    │  • Usage statistics         │           │
│  │  • Conversation display     │    │  • Cost tracking            │           │
│  │  • Tool call visibility     │    │  • Request logs             │           │
│  │  • Dashboard selector       │    │  • Error monitoring         │           │
│  └─────────────────────────────┘    └─────────────────────────────┘           │
└────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                            EXPRESS.JS SERVER                                   │
│                            (src/server.ts)                                     │
│                                                                                │
│  Endpoints:                                                                    │
│  • POST /chat          → Process user messages                                 │
│  • GET /admin/stats    → Usage statistics                                      │
│  • GET /admin/logs     → Request history                                       │
│  • GET /health         → Health check                                          │
└────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                              AGENT LOOP                                        │
│                          (src/agent/loop.ts)                                   │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │   User Message ──► Claude (Bedrock) ──► Response or Tool Call           │ │
│  │                          │                      │                        │ │
│  │                          │                      ▼                        │ │
│  │                          │              ┌──────────────┐                 │ │
│  │                          │              │  Tool Call?  │                 │ │
│  │                          │              └──────┬───────┘                 │ │
│  │                          │                     │                         │ │
│  │                          │         ┌──────────┴──────────┐              │ │
│  │                          │         ▼                     ▼              │ │
│  │                          │       [Yes]                 [No]             │ │
│  │                          │         │                     │              │ │
│  │                          │         ▼                     ▼              │ │
│  │                          │   Execute Tool          Return Response      │ │
│  │                          │         │                                    │ │
│  │                          │         ▼                                    │ │
│  │                          └──── Send Result Back to Claude               │ │
│  │                                    (loop continues)                     │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────┘
                          │                              │
                          ▼                              ▼
┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐
│          AWS BEDROCK                │  │           MCP SERVER                │
│                                     │  │       (src/mcp/server.ts)           │
│  • Claude Sonnet 4.5 model          │  │                                     │
│  • Converse API                     │  │  • Exposes tools via MCP protocol   │
│  • Tool use support                 │  │  • Executes tool implementations    │
│  • Token counting                   │  │  • Returns structured responses     │
│                                     │  │                                     │
└─────────────────────────────────────┘  └─────────────────────────────────────┘
                                                         │
                                                         ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                              TOOL LIBRARY                                      │
│                          (src/mcp/tools/*.ts)                                  │
│                                                                                │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐               │
│  │ block_util_      │ │ block_util_by_   │ │ block_util_by_   │               │
│  │ summary          │ │ block_group      │ │ surgeon          │               │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘               │
│                                                                                │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐               │
│  │ block_util_      │ │    (future)      │ │    (future)      │               │
│  │ drill_down       │ │                  │ │                  │               │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘               │
│                                                                                │
│  Currently: Stubbed data                                                       │
│  Future: Calls to LiveData Insights APIs                                       │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Configuration Layer

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           CONFIGURATION LAYER                                  │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         SITE CONFIG                                     │  │
│  │                    (src/config/site.json)                               │  │
│  │                                                                         │  │
│  │  Per-client/deployment configuration:                                   │  │
│  │  • API endpoints & authentication                                       │  │
│  │  • LLM settings (model, region, tokens)                                 │  │
│  │  • Data sanitization rules                                              │  │
│  │  • Feature flags                                                        │  │
│  │  • Data scope (facilities, service lines, date limits)                  │  │
│  │  • Boundaries (what assistant can/cannot answer)                        │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                        │
│                                       ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                      DASHBOARD MANIFESTS                                │  │
│  │              (src/config/dashboards/*.json)                             │  │
│  │                                                                         │  │
│  │  Per-dashboard configuration:                                           │  │
│  │  • Which tools are available                                            │  │
│  │  • Out-of-scope topics                                                  │  │
│  │  • Suggested questions                                                  │  │
│  │                                                                         │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                      │  │
│  │  │  block-utilization  │  │     (future)        │                      │  │
│  │  │       .json         │  │                     │                      │  │
│  │  └─────────────────────┘  └─────────────────────┘                      │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                        │
│                                       ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                        SYSTEM PROMPT                                    │  │
│  │                   (src/agent/prompts.ts)                                │  │
│  │                                                                         │  │
│  │  Dynamically built from:                                                │  │
│  │  • Base assistant instructions                                          │  │
│  │  • Site config boundaries                                               │  │
│  │  • Data scope constraints                                               │  │
│  │  • Available tools                                                      │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘
```

## PHI Protection & Data Sanitization

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      PHI PROTECTION LAYER                                    │
│                                                                              │
│  Data flows through multiple sanitization checkpoints to ensure no PHI      │
│  (Protected Health Information) is exposed to the LLM or end users.         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                        ┌─────────────────────┐                               │
│                        │   Insights API      │                               │
│                        │   (Raw Data)        │                               │
│                        │                     │                               │
│                        │ • Case IDs          │                               │
│                        │ • Patient MRNs      │                               │
│                        │ • Surgeon names     │                               │
│                        │ • Procedure details │                               │
│                        │ • Timestamps        │                               │
│                        └──────────┬──────────┘                               │
│                                   │                                          │
│                                   ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     SANITIZATION CHECKPOINT 1                          │ │
│  │                        (Tool Execution)                                │ │
│  │                                                                        │ │
│  │  Controlled by site.json → sanitization config:                        │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │  {                                                               │ │ │
│  │  │    "sanitization": {                                             │ │ │
│  │  │      "stripCaseIds": true,        ← Remove surgical case IDs     │ │ │
│  │  │      "allowSurgeonNames": true,   ← Keep surgeon names (not PHI) │ │ │
│  │  │      "allowProcedureTypes": true, ← Keep procedure categories    │ │ │
│  │  │      "redactPatientInfo": true    ← Remove all patient data      │ │ │
│  │  │    }                                                             │ │ │
│  │  │  }                                                               │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  │  Actions:                                                              │ │
│  │  ✗ Strip case IDs (e.g., "CASE-12345" → removed)                      │ │
│  │  ✗ Remove patient MRNs, names, DOB                                    │ │
│  │  ✗ Remove specific procedure times if configured                      │ │
│  │  ✓ Keep aggregated metrics (counts, percentages, averages)            │ │
│  │  ✓ Keep surgeon names (configurable per site)                         │ │
│  │  ✓ Keep service line / block group names                              │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                   │                                          │
│                                   ▼                                          │
│                        ┌─────────────────────┐                               │
│                        │   Sanitized Data    │                               │
│                        │   (Sent to Claude)  │                               │
│                        │                     │                               │
│                        │ • Utilization %     │                               │
│                        │ • Case counts       │                               │
│                        │ • Surgeon names     │                               │
│                        │ • Service lines     │                               │
│                        │ • Block metrics     │                               │
│                        └──────────┬──────────┘                               │
│                                   │                                          │
│                                   ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     SANITIZATION CHECKPOINT 2                          │ │
│  │                      (Response Filtering)                              │ │
│  │                                                                        │ │
│  │  Before returning response to user:                                    │ │
│  │                                                                        │ │
│  │  ✗ Scan for accidentally leaked identifiers                           │ │
│  │  ✗ Remove any patterns matching MRN/SSN formats                       │ │
│  │  ✗ Filter stack traces or internal errors                             │ │
│  │  ✓ Allow aggregated analytics language                                │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                   │                                          │
│                                   ▼                                          │
│                        ┌─────────────────────┐                               │
│                        │   Safe Response     │                               │
│                        │   (To User)         │                               │
│                        │                     │                               │
│                        │ "Dr. Smith has 58%  │                               │
│                        │  utilization with   │                               │
│                        │  42 cases this      │                               │
│                        │  month..."          │                               │
│                        └─────────────────────┘                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                      WHAT IS STRIPPED vs ALLOWED                             │
│                                                                              │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │         ALWAYS STRIPPED         │  │        ALLOWED (Configurable)   │   │
│  │              (PHI)              │  │            (Not PHI)            │   │
│  ├─────────────────────────────────┤  ├─────────────────────────────────┤   │
│  │ • Patient names                 │  │ • Surgeon names                 │   │
│  │ • Medical Record Numbers (MRN)  │  │ • Service line names            │   │
│  │ • Dates of birth                │  │ • Block group names             │   │
│  │ • Social Security Numbers       │  │ • Room/location names           │   │
│  │ • Addresses                     │  │ • Utilization percentages       │   │
│  │ • Phone numbers                 │  │ • Case counts (aggregated)      │   │
│  │ • Diagnosis codes (if linked)   │  │ • Time metrics (averages)       │   │
│  │ • Specific procedure times      │  │ • Trend data                    │   │
│  │ • Case-level identifiers        │  │ • Comparative analytics         │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                      SITE-SPECIFIC CONFIGURATION                             │
│                                                                              │
│  Different clients may have different privacy requirements:                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Hospital A (Strict)              │  Hospital B (Standard)          │    │
│  │  ─────────────────────────────    │  ─────────────────────────────  │    │
│  │  stripCaseIds: true               │  stripCaseIds: true             │    │
│  │  allowSurgeonNames: false  ←      │  allowSurgeonNames: true        │    │
│  │  allowProcedureTypes: false ←     │  allowProcedureTypes: true      │    │
│  │  redactPatientInfo: true          │  redactPatientInfo: true        │    │
│  │                                   │                                  │    │
│  │  Response: "Service line A has    │  Response: "Dr. Smith has 58%   │    │
│  │  58% utilization..."              │  utilization in Orthopedics..." │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                       │
│                                                                              │
│   1. USER ASKS QUESTION                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  "Which surgeons have utilization below 70% this month?"            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   2. SERVER RECEIVES REQUEST                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  POST /chat { message: "...", dashboard: "block-utilization" }      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   3. AGENT LOOP STARTS                                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • Load site config & dashboard manifest                            │   │
│   │  • Build system prompt with boundaries                              │   │
│   │  • Filter available tools by dashboard                              │   │
│   │  • Send to Claude via Bedrock                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   4. CLAUDE DECIDES TO USE TOOL                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Tool: block_util_by_surgeon                                        │   │
│   │  Params: { start_date: "2026-01-01", end_date: "2026-01-13" }       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   5. MCP SERVER EXECUTES TOOL                                                │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • Validate parameters                                              │   │
│   │  • Call API (or return stubbed data for POC)                        │   │
│   │  • Return raw data from API                                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   5b. PHI SANITIZATION (before sending to LLM)                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Based on site.json sanitization config:                            │   │
│   │                                                                     │   │
│   │  ✗ STRIP: Case IDs, Patient MRNs, DOB, SSN, Addresses              │   │
│   │  ✓ KEEP:  Surgeon names, Service lines, Aggregated metrics         │   │
│   │                                                                     │   │
│   │  Raw: { caseId: "C-123", mrn: "MRN456", surgeon: "Smith", util: 58 }│   │
│   │                           ▼                                         │   │
│   │  Clean: { surgeon: "Smith", utilization: 58 }                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   6. CLAUDE ANALYZES RESULTS (PHI-free data only)                            │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • Reviews tool output                                              │   │
│   │  • May call additional tools if needed                              │   │
│   │  • Formulates natural language response                             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   7. RESPONSE RETURNED TO USER                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  "Based on the data, 3 surgeons have utilization below 70%:         │   │
│   │   • Dr. Smith (ENT) - 58%                                           │   │
│   │   • Dr. Jones (Plastics) - 56%                                      │   │
│   │   • Dr. Williams (Urology) - 68%                                    │   │
│   │   Would you like me to drill down into any of these?"               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                  AWS                                         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          AWS APP RUNNER                                │ │
│  │                                                                        │ │
│  │   ┌──────────────────────────────────────────────────────────────┐    │ │
│  │   │                    Lumen Application                         │    │ │
│  │   │                                                              │    │ │
│  │   │  • Express.js server                                         │    │ │
│  │   │  • MCP server (child process)                                │    │ │
│  │   │  • Static UI files                                           │    │ │
│  │   │  • In-memory usage tracking                                  │    │ │
│  │   │                                                              │    │ │
│  │   │  Auto-deploy from GitHub main branch                         │    │ │
│  │   └──────────────────────────────────────────────────────────────┘    │ │
│  │                              │                                         │ │
│  │                              │ IAM Role                                │ │
│  │                              ▼                                         │ │
│  │   ┌──────────────────────────────────────────────────────────────┐    │ │
│  │   │                     AWS BEDROCK                              │    │ │
│  │   │                                                              │    │ │
│  │   │  Claude Sonnet 4.5 (us.anthropic.claude-sonnet-4-5-...)     │    │ │
│  │   │                                                              │    │ │
│  │   │  Permissions: bedrock:InvokeModel                            │    │ │
│  │   └──────────────────────────────────────────────────────────────┘    │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     FUTURE: Data Sources                               │ │
│  │                                                                        │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │ │
│  │   │  LiveData       │  │  AWS Secrets    │  │  CloudWatch     │       │ │
│  │   │  Insights API   │  │  Manager        │  │  (Logging)      │       │ │
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘       │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Trigger Architecture (Future)

The agent core can be triggered by multiple sources. The same tools and knowledge are used regardless of trigger type.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           TRIGGER TYPES                                      │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         TRIGGER SOURCES                                │ │
│  │                                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │    USER      │  │    CRON      │  │    EVENT     │  │    API     │ │ │
│  │  │    CHAT      │  │  (Scheduled) │  │   STREAM     │  │   CALL     │ │ │
│  │  │              │  │              │  │              │  │            │ │ │
│  │  │ "What's our  │  │ Daily 6am:   │  │ Case delay   │  │ POST       │ │ │
│  │  │ utilization?"│  │ "Check for   │  │ detected:    │  │ /optimize  │ │ │
│  │  │              │  │ alerts"      │  │ "Assess      │  │ { goal }   │ │ │
│  │  │              │  │              │  │ impact"      │  │            │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │ │
│  │         │                 │                 │                │        │ │
│  └─────────┴─────────────────┴─────────────────┴────────────────┴────────┘ │
│                                      │                                      │
│                                      ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          AGENT CORE                                    │ │
│  │                       (src/agent/loop.ts)                              │ │
│  │                                                                        │ │
│  │  Input:                                                                │ │
│  │  • Task/Question (from any trigger)                                    │ │
│  │  • Context (user session, event data, API params)                      │ │
│  │  • Manifest (which tools/knowledge to use)                             │ │
│  │                                                                        │ │
│  │  Output:                                                               │ │
│  │  • Response text                                                       │ │
│  │  • Structured data (for API calls)                                     │ │
│  │  • Actions (for notifications)                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│                                      ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        OUTPUT HANDLERS                                 │ │
│  │                                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │   CHAT UI    │  │    EMAIL     │  │     SMS      │  │    JSON    │ │ │
│  │  │   Response   │  │   Service    │  │   Service    │  │  Response  │ │ │
│  │  │              │  │              │  │              │  │            │ │ │
│  │  │ Displayed    │  │ "Alert:      │  │ "OR 3 delay  │  │ { recs: [] │ │ │
│  │  │ in browser   │  │ Low util..." │  │ - action     │  │   proj: {} │ │ │
│  │  │              │  │              │  │ needed"      │  │ }          │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Event-Driven Flow (Future)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        EVENT-DRIVEN ARCHITECTURE                             │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                      EVENT SOURCES                                  │    │
│   │                                                                     │    │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │    │
│   │  │  LiveData       │  │  Scheduler      │  │  External       │    │    │
│   │  │  Real-time Feed │  │  (Cron Jobs)    │  │  Webhooks       │    │    │
│   │  │                 │  │                 │  │                 │    │    │
│   │  │ • Case started  │  │ • Daily 6am     │  │ • EHR updates   │    │    │
│   │  │ • Case delayed  │  │ • Weekly report │  │ • Schedule      │    │    │
│   │  │ • Block unused  │  │ • Month-end     │  │   changes       │    │    │
│   │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘    │    │
│   │           │                    │                    │              │    │
│   └───────────┴────────────────────┴────────────────────┴──────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                      EVENT PROCESSOR                                │    │
│   │                                                                     │    │
│   │  1. Receive event                                                   │    │
│   │  2. Match against manifest triggers                                 │    │
│   │  3. Build context for agent                                         │    │
│   │  4. Invoke agent with task                                          │    │
│   │                                                                     │    │
│   │  Example trigger match:                                             │    │
│   │  ┌───────────────────────────────────────────────────────────────┐ │    │
│   │  │  Event: { type: "case_delay", delay_minutes: 45, or: "OR-3" } │ │    │
│   │  │                           ▼                                    │ │    │
│   │  │  Manifest trigger:                                             │ │    │
│   │  │  {                                                             │ │    │
│   │  │    "case_delay": {                                             │ │    │
│   │  │      "condition": "delay_minutes > 30",  ← MATCHED             │ │    │
│   │  │      "task": "Assess schedule impact",                         │ │    │
│   │  │      "notify": ["charge_nurse"]                                │ │    │
│   │  │    }                                                           │ │    │
│   │  │  }                                                             │ │    │
│   │  └───────────────────────────────────────────────────────────────┘ │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                        AGENT EXECUTION                              │    │
│   │                                                                     │    │
│   │  Context injected:                                                  │    │
│   │  • Event data (which case, how late, which OR)                      │    │
│   │  • Downstream impact (cases scheduled after)                        │    │
│   │  • Available options (other ORs, flexibility)                       │    │
│   │                                                                     │    │
│   │  Agent calls tools:                                                 │    │
│   │  • get_or_schedule() → see what's affected                          │    │
│   │  • get_available_ors() → find alternatives                          │    │
│   │  • get_case_flexibility() → which cases can move                    │    │
│   │                                                                     │    │
│   │  Agent produces:                                                    │    │
│   │  • Analysis of impact                                               │    │
│   │  • Ranked recommendations                                           │    │
│   │  • Suggested actions                                                │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                     NOTIFICATION SERVICE                            │    │
│   │                                                                     │    │
│   │  Based on manifest config and site preferences:                     │    │
│   │                                                                     │    │
│   │  ┌─────────────────────────────────────────────────────────────┐   │    │
│   │  │  To: Charge Nurse (Sarah)                                   │   │    │
│   │  │  Channel: Push + Dashboard Alert                            │   │    │
│   │  │  Priority: High (case delay > 30min)                        │   │    │
│   │  │                                                             │   │    │
│   │  │  Message:                                                   │   │    │
│   │  │  "OR 3: Dr. Chen's case running 45min over.                 │   │    │
│   │  │                                                             │   │    │
│   │  │  Impact: 2 afternoon cases will be delayed                  │   │    │
│   │  │                                                             │   │    │
│   │  │  Recommendation: Move case C-456 to OR 7 (available 1-4pm)  │   │    │
│   │  │                                                             │   │    │
│   │  │  [Approve Move] [Delay Cases] [Dismiss]"                    │   │    │
│   │  └─────────────────────────────────────────────────────────────┘   │    │
│   │                                                                     │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Multi-Site Scaling (Future)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         MULTI-SITE ARCHITECTURE                              │
│                                                                              │
│  Single deployment serves 100+ sites via site-specific configuration:       │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                         REQUEST FLOW                                │    │
│   │                                                                     │    │
│   │  POST /chat { siteId: "hospital-a", message: "..." }                │    │
│   │                           │                                         │    │
│   │                           ▼                                         │    │
│   │  ┌─────────────────────────────────────────────────────────────┐   │    │
│   │  │                   CONFIG LOADER                             │   │    │
│   │  │                                                             │   │    │
│   │  │  Load from S3: s3://lumen-configs/hospital-a.json           │   │    │
│   │  │  (cached in memory, refreshed periodically)                 │   │    │
│   │  └─────────────────────────────────────────────────────────────┘   │    │
│   │                           │                                         │    │
│   │                           ▼                                         │    │
│   │  ┌─────────────────────────────────────────────────────────────┐   │    │
│   │  │  Site-specific settings applied:                            │   │    │
│   │  │  • API endpoint for this hospital's Insights API            │   │    │
│   │  │  • Sanitization rules (what PHI to strip)                   │   │    │
│   │  │  • Boundaries (what questions to answer)                    │   │    │
│   │  │  • Notification preferences                                 │   │    │
│   │  │  • Alert thresholds                                         │   │    │
│   │  └─────────────────────────────────────────────────────────────┘   │    │
│   │                                                                     │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                      CONFIG STORAGE                                 │    │
│   │                                                                     │    │
│   │  S3 Bucket: lumen-configs/                                          │    │
│   │  ├── hospital-a.json                                                │    │
│   │  ├── hospital-b.json                                                │    │
│   │  ├── clinic-xyz.json                                                │    │
│   │  └── ... (100+ sites)                                               │    │
│   │                                                                     │    │
│   │  Secrets Manager:                                                   │    │
│   │  ├── lumen/hospital-a/api-key                                       │    │
│   │  ├── lumen/hospital-b/api-key                                       │    │
│   │  └── ...                                                            │    │
│   │                                                                     │    │
│   │  Adding a new site = upload JSON + add secret                       │    │
│   │  No deployment required                                             │    │
│   │                                                                     │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## File Structure

```
livedata_lumen/
├── src/
│   ├── server.ts                 # Express server, API endpoints
│   ├── agent/
│   │   ├── loop.ts               # Agent loop, Bedrock integration
│   │   └── prompts.ts            # System prompt builder
│   ├── mcp/
│   │   ├── server.ts             # MCP server
│   │   ├── client.ts             # MCP client
│   │   ├── types.ts              # Tool type definitions
│   │   ├── tool-registry.ts      # Tool registration
│   │   └── tools/
│   │       ├── index.ts          # Tool exports
│   │       ├── block-util-summary.ts
│   │       ├── block-util-by-block-group.ts
│   │       ├── block-util-by-surgeon.ts
│   │       └── block-util-drill-down.ts
│   ├── config/
│   │   ├── site.json             # Site configuration
│   │   ├── site.ts               # Site config loader
│   │   └── dashboards/
│   │       ├── index.ts          # Dashboard manifest loader
│   │       └── block-utilization.json
│   └── services/
│       └── usage-tracker.ts      # Usage & cost tracking
├── ui/
│   ├── index.html                # Chat interface
│   └── admin.html                # Admin dashboard
├── dist/                         # Compiled output
├── PROJECT.md                    # Project overview
├── TODO.md                       # Enhancement backlog
├── ARCHITECTURE.md               # This file
├── package.json
└── tsconfig.json
```
