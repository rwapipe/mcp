# RWA Pipe MCP Server

MCP (Model Context Protocol) server for connecting AI agents to Real World Asset data.

## Installation

```bash
cd src/mcp
npm install
npm run build
```

## Usage with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "rwapipe": {
      "command": "node",
      "args": ["/path/to/rwapipe/src/mcp/dist/index.js"]
    }
  }
}
```

## Available Tools

### Tokens
- **get_rwa_tokens** - List all tracked RWA tokens (filter by chain/type)
- **get_token_details** - Get token info including supply and APY
- **get_token_transfers** - Get recent transfers for a token
- **get_token_holders** - Get top holders of a token
- **get_token_history** - Get historical TVL/supply data

### Portfolio
- **get_wallet_portfolio** - Get all RWA holdings for a wallet
- **get_holder_balance** - Get balance of specific holder

### Market
- **get_rwa_market** - Market overview with all token stats
- **get_market_stats** - Total TVL, token count, average APY
- **get_market_trends** - 24h/7d changes by category and chain
- **get_market_movers** - Top gainers and losers

### TVL
- **get_tvl_history** - Historical TVL data
- **get_tvl_by_chain** - Current TVL by blockchain

### Issuers
- **get_issuers** - List all token issuers with TVL
- **get_issuer_details** - Issuer details and their tokens

### Categories & Chains
- **get_categories** - Token categories (treasury, stablecoin, etc.)
- **get_category_details** - Category details and tokens
- **get_chains** - Supported blockchains with TVL

## Example Queries

Ask Claude:
- "What RWA tokens are tracked by RWA Pipe?"
- "What's the total TVL in tokenized treasuries?"
- "Show me the total supply of BlackRock's BUIDL token"
- "What tokens are available on Base?"
- "What are the top gainers in the last 24 hours?"
- "Show me my RWA portfolio for 0x..."
- "What issuers have the highest TVL?"

## Environment Variables

- `RWAPIPE_API_URL`: API base URL (default: https://rwapipe.com/api)
