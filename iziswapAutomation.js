const { ethers } = require('ethers');
const readline = require('readline');

// Taiko RPC URL
const RPC_URL = 'https://rpc.mainnet.taiko.xyz';

// The WETH contract address with correct checksum
const WETH_TAIKO_ADDRESS = ethers.utils.getAddress('0xa51894664a773981c6c112c43ce576f315d5b1b6'); // Correct checksum

// WETH contract ABI (minimal ABI for deposit function)
const wethAbi = [
  "function deposit() payable"
];

// Private key of the wallet (replace with your private key)
const privateKey = ''; // Replace with your private key

// Create a command line interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to wrap ETH into WETH
const wrapEthToWeth = async (amountInEth, repetition) => {
    // Setup provider to connect to the Taiko network
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

    // Create a wallet instance
    const wallet = new ethers.Wallet(privateKey, provider);

    // Create a contract instance for the WETH contract
    const wethContract = new ethers.Contract(WETH_TAIKO_ADDRESS, wethAbi, wallet);

    for (let i = 0; i < repetition; i++) {
        console.log(`Transaction ${i + 1} out of ${repetition}: Wrapping ${amountInEth} ETH into WETH`);

        // Convert the input amount to Wei (smallest unit of ETH)
        const amountInWei = ethers.utils.parseEther(amountInEth);

        try {
            // Send the deposit transaction to wrap ETH into WETH
            const tx = await wethContract.deposit({
                value: amountInWei, // Amount of ETH to wrap
                gasLimit: 50000, // Set an appropriate gas limit
                gasPrice: ethers.utils.parseUnits('10', 'gwei') // Set gas price (adjust as necessary)
            });

            console.log('Transaction hash:', tx.hash);

            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            console.log('Transaction confirmed in block:', receipt.blockNumber);

        } catch (error) {
            console.error(`Error during transaction ${i + 1}:`, error);
            break; // Stop the loop if any transaction fails
        }
    }
};

// Prompt the user for input
rl.question('Enter the number of repetitions: ', (repetitionInput) => {
    const repetition = parseInt(repetitionInput);
    
    rl.question('Enter the amount of ETH to wrap (e.g., 0.00004): ', (amountInEth) => {

        console.log(`\nTotal Transactions: ${repetition}`);
        console.log(`Amount to wrap per transaction: ${amountInEth} ETH\n`);

        // Start the wrapping process
        wrapEthToWeth(amountInEth, repetition).then(() => {
            console.log('All transactions completed.');
            rl.close();
        }).catch(error => {
            console.error('Error during transactions:', error);
            rl.close();
        });
    });
});
