import cron from 'node-cron'
import faucetClaimService from '../services/faucetClaim'

// Cronjob to process faucet claims by batch of 1k each 15 seconds
export default cron.schedule('* * * * *', function() {
    faucetClaimService.processQueue()
});