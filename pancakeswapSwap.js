const { ethers } = require('ethers');
const readline = require('readline');

// PancakeSwap Router Contract Address on BSC Testnet
const PANCAKESWAP_ROUTER_ADDRESS = '0x9ac64cc6e4415144c455bd8e4837fea55603e5c3';

// PancakeSwap Router ABI (simple version for token swap)
const routerAbi = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ask user for inputs
rl.question('Enter your private key: ', (privateKey) => {
    rl.question('Input Address Token 1 (BNB/WBNB): ', (token1) => {
        rl.question('Input Address Token 2 (Token to receive): ', (token2) => {
            rl.question('Enter the nominal amount of the transaction (in BNB): ', (amountIn) => {
                rl.question('Enter the number of repetitions of the transaction: ', (repeatCount) => {
                    rl.question('Input the amount of delay time (in milliseconds): ', (delayTime) => {
                        // Convert inputs into proper formats
                        const amountInWei = ethers.utils.parseEther(amountIn);

                        // Execute the swap logic with the provided inputs
                        performSwap(privateKey, token1, token2, amountInWei, repeatCount, delayTime)
                            .then(() => {
                                console.log('All swaps completed.');
                                rl.close();
                            })
                            .catch(error => {
                                console.error('Error during swap execution:', error);
                                rl.close();
                            });
                    });
                });
            });
        });
    });
});

// Function to perform the swap with delay and repetitions
const performSwap = async (privateKey, token1, token2, amountInWei, repeatCount, delayTime) => {
    // 1. Setup the provider (connect to BSC Testnet)
    const provider = new ethers.providers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545');

    // 2. Setup the wallet
    const wallet = new ethers.Wallet(privateKey, provider);

    // 3. Instantiate the PancakeSwap Router contract
    const router = new ethers.Contract(PANCAKESWAP_ROUTER_ADDRESS, routerAbi, wallet);

    // 4. Create the swap path (BNB -> Token2)
    const path = [token1, token2];

    // Start the transaction loop
    for (let i = 0; i < repeatCount; i++) {
        console.log(`Executing swap #${i + 1}...`);

        // 5. Set deadline for the transaction (current time + 20 minutes)
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

        // 6. Get estimated amounts
        const amountsOut = await router.getAmountsOut(amountInWei, path);
        const amountOutMin = amountsOut[1].sub(amountsOut[1].div(10)); // Set a slippage tolerance of 10%

        console.log(`Swapping ${ethers.utils.formatEther(amountInWei)} BNB for at least ${ethers.utils.formatUnits(amountOutMin, 18)} tokens.`);

        // 7. Perform the swap
        const tx = await router.swapExactETHForTokens(
            amountOutMin, // Minimum amount of tokens to receive
            path, // Path (BNB -> Token)
            wallet.address, // The address to send the tokens to
            deadline, // Deadline
            {
                value: amountInWei, // The amount of BNB to swap
                gasLimit: 200000, // Estimated gas limit
                gasPrice: ethers.utils.parseUnits('10', 'gwei') // Gas price (adjust based on current network conditions)
            }
        );

        console.log('Swap transaction sent. Transaction hash:', tx.hash);

        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        // 8. Delay between repetitions
        if (i < repeatCount - 1) {
            console.log(`Waiting for ${delayTime}ms before the next transaction...`);
            await delay(delayTime);
        }
    }
};

// Helper function for delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
