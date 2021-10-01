# Ternoa API

"Ternoa API" is the server used by "SecretNFT API" server and more generally to handle data about marketplaces, faucet and users. 

## Summary
- [Installation](#Installation)
- [Usage](#Usage)
- [Information](#Information)
- [Environment variables](#Environment-variables)
- [API Endpoints](#API-Endpoints)
    - [Marketplaces](#Marketplaces)
    - [Faucet](#Faucet)
    - [Users](#Users)
- [Contributing](#Contributing)
- [License](#License)

## Installation
Using NPM
```bash
  git clone https://github.com/capsule-corp-ternoa/ternoa-api.git
  cd ternoa-api
  npm install
```

## Usage
You need to set up environnent variables to target the correct API.
You can find at more information on the Environment variables section.

To run
```bash
npm start
```
To build the project
```bash
npm run build
```

## Information
Ternoa-API handles the data of all marketplaces users, it manages the data of all the marketplaces and also handles faucet claims for test caps.
This API is linked to SecretNFT app and it's api. Don't hesitate to have a look on those two repositories on our organisation [github](https://github.com/capsule-corp-ternoa.)

## Environment variables
To run this project, you will need to add the following environment variables to your .env file

| VARIABLE | VALUE | USAGE |
| :---|---|--- |

| INDEXER_URL | https://indexer.chaos.ternoa.com/ | Address of Ternoa's blockchain indexer |
| MONGODB_URI | mongodb+srv://***:***@***?retryWrites=true&w=majority | Mongo DB URI to store data |
| BLOCK_CHAIN_URL | wss://chaos.ternoa.com | blockchain address |
| PORT | 8080 | Port to start the app, default: 8080 |
| SENTRY_DSN | https://projectId@sentry.io/x | The url to your sentry project if you want to monitor activity |
| SENTRY_ENV | development or production or ... | Allow to separate monitoring on environment |
| TWITTER_CONSUMER_KEY | twitter dev consumer key | Allow twitter verification see Twitter [Docs](https://developer.twitter.com/en/docs/authentication/oauth-1-0a/obtaining-user-access-tokens) |
| TWITTER_CONSUMER_SECRET | twitter dev consumer secret | Allow twitter verification see Twitter [Docs](https://developer.twitter.com/en/docs/authentication/oauth-1-0a/obtaining-user-access-tokens) |
| TWITTER_REDIRECT_URL | https://www.secret-nft.com/profile?scope=edit | URL to redirect after twitter verification |

## API Endpoints
### Marketplaces

### Faucet

### Users
`PATCH /api/users/reviewRequested/:id` : Allow user to request review of their account (use the Ternoa-api)

Parameters: 
| PARAMETER | TYPE | MANDATORY | USE |
| :---|---|---|---|
| id | request param | yes | id of user to review request for |

`GET /api/users/` : Gets all users (use the Ternoa-api)

Parameters: 
| PARAMETER | TYPE | MANDATORY | USE |
| :---|---|---|---|
| page | query param | no | page number (1) |
| limit | query param | no | number of elements per page (10) |

`GET /api/users/verifyTwitter/:id` : Verify Twitter username of specified user's id (use the Ternoa-api)

Parameters: 
| PARAMETER | TYPE | MANDATORY | USE |
| :---|---|---|---|
| id | request param | yes | id of user to review request for |

`GET /api/users/getUsers/` : Get users by wallet ids (use the Ternoa-api)

Parameters: 
| PARAMETER | TYPE | MANDATORY | USE |
| :---|---|---|---|
| walletIds | query param | yes | wallet addresses (?walletIds=5HGa..., ?walletIds=5HGa...&walletIds=5HTa...) |

`GET /api/users/:id` : Get user by wallet id (use the Ternoa-api)

Parameters: 
| PARAMETER | TYPE | MANDATORY | USE |
| :---|---|---|---|
| id | request param | yes | wallet address |
| ip | request param | no | ip of user to prevent spam views |
| incViews | query param | no | increment views or not (true, false) |
| viewerWalletId | query param | no | wallet address of the viewer, if connected |

`GET /api/users/:id/caps` : Get user's caps balance

Parameters: 
| PARAMETER | TYPE | MANDATORY | USE |
| :---|---|---|---|
| id | request param | yes | wallet address of user to get balance |

`GET /api/users/:id/liked` : Get user's liked NFTs

Parameters: 
| PARAMETER | TYPE | MANDATORY | USE |
| :---|---|---|---|
| id | request param | yes | wallet address of user to get likes |
| page | query param | no | page number (1) |
| limit | query param | no | number of elements per page (10) |

`POST /api/users/create` : Create a new user if it does not exist (use the Ternoa-api)

Parameters: 
| PARAMETER | TYPE | MANDATORY | USE |
| :---|---|---|---|
| walletId | body param | yes | wallet address of user to create |

`POST /api/users/like` : Like an NFT (use the Ternoa-api)

Parameters: 
| PARAMETER | TYPE | MANDATORY | USE |
| :---|---|---|---|
| walletId | query param | yes | wallet address of user |
| nftId | query param | yes | NFT id to like |
| serieId | query param | yes | NFT serieId to like |

`POST /api/users/unlike` : Unike an NFT (use the Ternoa-api)

Parameters: 
| PARAMETER | TYPE | MANDATORY | USE |
| :---|---|---|---|
| walletId | query param | yes | wallet address of user |
| nftId | query param | yes | NFT id to like |
| serieId | query param | yes | NFT serieId to like |

`POST /api/users/:walletId` : Update a user (use the Ternoa-api, must be signed by wallet)

Parameters: 
| PARAMETER | TYPE | MANDATORY | USE |
| :---|---|---|---|
| walletId | request param | yes | wallet address of user to update |
| name | body param | yes | username |
| customUrl | body param | no | user's given url (url to showcase for example) |
| bio | body param | no | user's bio |
| twitterName | body param | no | user's twitter name |
| personalUrl | body param | no | user's personal website url |
| picture | body param | no | user's picture url |
| banner | body param | no | user's banner url |

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT ?](https://choosealicense.com/licenses/mit/)
