#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import http from 'http';
import { URL } from 'url';

// API Configuration
const API_BASE = process.env.RWAPIPE_API_URL || 'https://rwapipe.com/api';
const PORT = parseInt(process.env.MCP_PORT || '3001', 10);
const MODE = process.env.MCP_MODE || 'stdio'; // 'stdio' or 'sse'

// Tool definitions
const tools: Tool[] = [
  {
    name: 'get_rwa_tokens',
    description: 'Get list of all tracked RWA (Real World Asset) tokens. Can filter by chain or type.',
    inputSchema: {
      type: 'object',
      properties: {
        chain: {
          type: 'string',
          description: 'Filter by blockchain (ethereum, base, arbitrum, polygon, avalanche, bsc, optimism, zksync, mantle, solana, sui, aptos)',
          enum: ['ethereum', 'base', 'arbitrum', 'polygon', 'avalanche', 'bsc', 'optimism', 'zksync', 'mantle', 'solana', 'sui', 'aptos'],
        },
        type: {
          type: 'string',
          description: 'Filter by asset type (us-treasury, money-market, stablecoin, lst, wrapped, rwa-misc)',
          enum: ['us-treasury', 'money-market', 'stablecoin', 'lst', 'wrapped', 'rwa-misc'],
        },
      },
    },
  },
  {
    name: 'get_token_details',
    description: 'Get detailed information about a specific RWA token including total supply and APY',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Token contract address (e.g., 0x7712c34205737192402172409a8f7ccef8aa2aec for BUIDL)',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_token_transfers',
    description: 'Get recent transfers for a specific RWA token',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Token contract address',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of transfers to return (default: 20, max: 100)',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_token_holders',
    description: 'Get top holders of a specific RWA token sorted by balance',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Token contract address',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of holders to return (default: 20, max: 100)',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_holder_balance',
    description: 'Get the balance of a specific holder for an RWA token',
    inputSchema: {
      type: 'object',
      properties: {
        token_address: {
          type: 'string',
          description: 'Token contract address',
        },
        holder_address: {
          type: 'string',
          description: 'Holder wallet address',
        },
      },
      required: ['token_address', 'holder_address'],
    },
  },
  {
    name: 'get_wallet_portfolio',
    description: 'Get all RWA holdings for a wallet address across all supported chains',
    inputSchema: {
      type: 'object',
      properties: {
        wallet: {
          type: 'string',
          description: 'Wallet address to check (e.g., 0x...)',
        },
      },
      required: ['wallet'],
    },
  },
  {
    name: 'get_rwa_market',
    description: 'Get market overview with total TVL, average APY, and all token statistics',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_tvl_history',
    description: 'Get historical TVL (Total Value Locked) data. Can filter by chain and specify time period.',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days of history to return (default: 30, max: 365)',
        },
        chain: {
          type: 'string',
          description: 'Filter by specific chain (optional)',
          enum: ['ethereum', 'base', 'arbitrum', 'polygon', 'avalanche', 'bsc', 'optimism', 'zksync', 'mantle', 'solana', 'sui', 'aptos'],
        },
      },
    },
  },
  {
    name: 'get_tvl_by_chain',
    description: 'Get current TVL breakdown by blockchain with 24h and 7d change percentages',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_market_stats',
    description: 'Get comprehensive market statistics including total TVL, token count, average APY, and 24h/7d changes',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_token_history',
    description: 'Get historical TVL and supply data for a specific token',
    inputSchema: {
      type: 'object',
      properties: {
        chain: {
          type: 'string',
          description: 'Blockchain name (e.g., ethereum, base)',
        },
        address: {
          type: 'string',
          description: 'Token contract address',
        },
        days: {
          type: 'number',
          description: 'Number of days of history (default: 30, max: 365)',
        },
      },
      required: ['chain', 'address'],
    },
  },
  {
    name: 'get_issuers',
    description: 'Get list of all RWA token issuers with aggregated TVL, token counts, and average APY. Sorted by TVL.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_issuer_details',
    description: 'Get detailed information about a specific issuer including all their tokens',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Issuer name (e.g., BlackRock, Ondo Finance, Circle)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_categories',
    description: 'Get list of all RWA token categories (us-treasury, stablecoin, money-market, etc.) with TVL and stats',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_category_details',
    description: 'Get detailed information about a specific category including all tokens in that category',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Category type',
          enum: ['us-treasury', 'stablecoin', 'commodity', 'equity', 'non-us-debt', 'corporate-bond', 'private-credit', 'money-market', 'structured-credit', 'real-estate'],
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'get_chains',
    description: 'Get list of all supported blockchains with TVL, token counts, and categories per chain',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_market_trends',
    description: 'Get market trends including TVL changes over 24h and 7d, breakdown by category and chain',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_market_movers',
    description: 'Get top gainers and losers by 24h TVL change. Shows tokens with biggest increases and decreases.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of tokens to return in each category (default: 5, max: 20)',
        },
      },
    },
  },
];

// API fetch helper
async function fetchAPI(endpoint: string): Promise<any> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Create server instance
function createServer() {
  const server = new Server(
    {
      name: 'rwapipe-mcp',
      version: '0.3.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'get_rwa_tokens': {
          const params = new URLSearchParams();
          if (args?.chain) params.set('chain', args.chain as string);
          if (args?.type) params.set('type', args.type as string);
          const query = params.toString() ? `?${params.toString()}` : '';
          const data = await fetchAPI(`/tokens${query}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_token_details': {
          const address = args?.address as string;
          if (!address) throw new Error('address is required');
          const data = await fetchAPI(`/tokens/${address}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_token_transfers': {
          const address = args?.address as string;
          const limit = (args?.limit as number) || 20;
          if (!address) throw new Error('address is required');
          const data = await fetchAPI(`/tokens/${address}/transfers?limit=${limit}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_token_holders': {
          const address = args?.address as string;
          const limit = (args?.limit as number) || 20;
          if (!address) throw new Error('address is required');
          const data = await fetchAPI(`/tokens/${address}/holders?limit=${limit}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_holder_balance': {
          const tokenAddress = args?.token_address as string;
          const holderAddress = args?.holder_address as string;
          if (!tokenAddress || !holderAddress) {
            throw new Error('token_address and holder_address are required');
          }
          const data = await fetchAPI(`/tokens/${tokenAddress}/balance/${holderAddress}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_wallet_portfolio': {
          const wallet = args?.wallet as string;
          if (!wallet) throw new Error('wallet is required');
          const data = await fetchAPI(`/portfolio/${wallet}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_rwa_market': {
          const data = await fetchAPI('/market');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_tvl_history': {
          const params = new URLSearchParams();
          if (args?.days) params.set('days', String(args.days));
          if (args?.chain) params.set('chain', args.chain as string);
          const query = params.toString() ? `?${params.toString()}` : '';
          const data = await fetchAPI(`/tvl/history${query}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_tvl_by_chain': {
          const data = await fetchAPI('/tvl/chains');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_market_stats': {
          const data = await fetchAPI('/stats');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_token_history': {
          const chain = args?.chain as string;
          const address = args?.address as string;
          const days = (args?.days as number) || 30;
          if (!chain || !address) {
            throw new Error('chain and address are required');
          }
          const data = await fetchAPI(`/tokens/${chain}/${address}/history?days=${days}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_issuers': {
          const data = await fetchAPI('/issuers');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_issuer_details': {
          const name = args?.name as string;
          if (!name) throw new Error('name is required');
          const data = await fetchAPI(`/issuers/${encodeURIComponent(name)}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_categories': {
          const data = await fetchAPI('/categories');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_category_details': {
          const type = args?.type as string;
          if (!type) throw new Error('type is required');
          const data = await fetchAPI(`/categories/${type}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_chains': {
          const data = await fetchAPI('/chains');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_market_trends': {
          const data = await fetchAPI('/market/trends');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case 'get_market_movers': {
          const limit = (args?.limit as number) || 5;
          const data = await fetchAPI(`/market/movers?limit=${limit}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// SSE Server for hosted mode
async function startSSEServer() {
  const transports = new Map<string, SSEServerTransport>();

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', mode: 'sse', version: '0.3.0' }));
      return;
    }

    // SSE endpoint for new connections
    if (url.pathname === '/sse' && req.method === 'GET') {
      console.log('New SSE connection');

      const transport = new SSEServerTransport('/message', res);
      const server = createServer();

      transports.set(transport.sessionId, transport);

      res.on('close', () => {
        console.log(`SSE connection closed: ${transport.sessionId}`);
        transports.delete(transport.sessionId);
      });

      await server.connect(transport);
      return;
    }

    // Message endpoint for POST requests
    if (url.pathname === '/message' && req.method === 'POST') {
      const sessionId = url.searchParams.get('sessionId');

      if (!sessionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'sessionId required' }));
        return;
      }

      const transport = transports.get(sessionId);
      if (!transport) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Session not found' }));
        return;
      }

      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          await transport.handlePostMessage(req, res, body);
        } catch (error) {
          console.error('Error handling message:', error);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        }
      });
      return;
    }

    // Info endpoint
    if (url.pathname === '/' || url.pathname === '/info') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: 'rwapipe-mcp',
        version: '0.3.0',
        description: 'RWA Pipe MCP Server - Connect AI agents to Real World Asset data',
        endpoints: {
          sse: '/sse',
          message: '/message',
          health: '/health',
        },
        tools: tools.map(t => ({ name: t.name, description: t.description })),
        documentation: 'https://rwapipe.com/mcp/',
      }));
      return;
    }

    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  httpServer.listen(PORT, () => {
    console.log(`RWA Pipe MCP Server (SSE) running on port ${PORT}`);
    console.log(`Connect via: http://localhost:${PORT}/sse`);
  });
}

// Start server based on mode
async function main() {
  if (MODE === 'sse') {
    await startSSEServer();
  } else {
    // Default stdio mode for local use
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('RWA Pipe MCP Server running on stdio');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
