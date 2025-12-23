# RWA Pipe MCP Server

MCP (Model Context Protocol) server for connecting AI agents to Real World Asset data. Track $300B+ in tokenized treasuries, stablecoins, and RWA tokens across 25 blockchains.

## Quick Start

### npm (Recommended)

```bash
npx rwapipe-mcp
```

### From Source

```bash
git clone https://github.com/rwapipe/mcp.git
cd mcp
npm install
npm run build
npm start
```

## Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "rwapipe": {
      "command": "npx",
      "args": ["rwapipe-mcp"]
    }
  }
}
```

Or with local installation:

```json
{
  "mcpServers": {
    "rwapipe": {
      "command": "node",
      "args": ["/path/to/mcp/dist/index.js"]
    }
  }
}
```

## Available Tools (18)

### Tokens
| Tool | Description |
|------|-------------|
| `get_rwa_tokens` | List all tracked RWA tokens. Filter by chain or category |
| `get_token_details` | Get token info: supply, APY, holders, issuer |
| `get_token_transfers` | Recent transfers for a token |
| `get_token_holders` | Top holders sorted by balance |
| `get_token_history` | Historical TVL/supply data |

### Portfolio
| Tool | Description |
|------|-------------|
| `get_wallet_portfolio` | All RWA holdings for a wallet across all chains |
| `get_holder_balance` | Balance of specific holder for a token |

### Market
| Tool | Description |
|------|-------------|
| `get_rwa_market` | Market overview with all token stats |
| `get_market_stats` | Total TVL, token count, average APY |
| `get_market_trends` | 24h/7d changes by category and chain |
| `get_market_movers` | Top gainers and losers |

### TVL
| Tool | Description |
|------|-------------|
| `get_tvl_history` | Historical TVL data (up to 365 days) |
| `get_tvl_by_chain` | Current TVL breakdown by blockchain |

### Issuers
| Tool | Description |
|------|-------------|
| `get_issuers` | All token issuers with aggregated TVL |
| `get_issuer_details` | Issuer details and their tokens |

### Categories & Chains
| Tool | Description |
|------|-------------|
| `get_categories` | Token categories with TVL stats |
| `get_category_details` | Category details and tokens |
| `get_chains` | Supported blockchains with TVL |

## Supported Blockchains (25)

### EVM Chains
ethereum, arbitrum, avalanche, base, bsc, celo, linea, mantle, optimism, polygon, zksync, fraxtal, ink, plume, sei

### Non-EVM Chains
solana, sui, aptos, near, ton, tron, stellar, xrpl, algorand, hedera

## Asset Categories (10)

| Category | Description |
|----------|-------------|
| `us-treasury` | US Treasury-backed tokens (BUIDL, USDY, OUSG) |
| `stablecoin` | Fiat-backed stablecoins (USDT, USDC) |
| `money-market` | Money market funds |
| `commodity` | Commodity-backed tokens (PAXG, XAUT) |
| `equity` | Tokenized equities |
| `non-us-debt` | Non-US sovereign debt |
| `corporate-bond` | Corporate bonds |
| `private-credit` | Private credit instruments |
| `structured-credit` | Structured credit products |
| `real-estate` | Real estate tokens |

## Example Queries

Ask Claude:

**Market Overview**
- "What's the total TVL in tokenized RWAs?"
- "Show me the top 5 RWA tokens by TVL"
- "What are the top gainers in the last 24 hours?"

**Token Research**
- "Tell me about BlackRock's BUIDL token"
- "What's the current APY for USDY?"
- "Compare BUIDL vs USDY yields"

**Chain Analysis**
- "What RWA tokens are available on Base?"
- "Which chain has the highest RWA TVL?"
- "Show me all treasuries on Ethereum"

**Portfolio**
- "Check my RWA holdings for 0x..."
- "What's my BUIDL balance?"

**Issuers**
- "What issuers have the highest TVL?"
- "Show me all Ondo Finance tokens"

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RWAPIPE_API_URL` | `https://rwapipe.com/api` | API endpoint |
| `MCP_MODE` | `stdio` | Transport mode: `stdio` or `sse` |
| `MCP_PORT` | `3001` | Port for SSE mode |

## SSE Mode (Hosted)

For hosted deployments, run in SSE mode:

```bash
MCP_MODE=sse MCP_PORT=3001 npm start
```

Endpoints:
- `GET /sse` - SSE connection endpoint
- `POST /message` - Message endpoint
- `GET /health` - Health check
- `GET /` - Server info

## Links

- Website: https://rwapipe.com
- API Docs: https://rwapipe.com/docs
- GitHub: https://github.com/rwapipe/mcp

## License

MIT
