const { ethers } = require('ethers');
const readline = require('readline');

const excludedWallet = '0xde2DbBD06b55b6c9A1893d99c8760dDb912411a0'; // Wallet to exclude

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter the JSON RPC Provider URL: ', (providerUrl) => {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);

    rl.question('Enter your private key: ', (privateKey) => {
        const privateKeys = [privateKey];

        rl.question('Enter the number of receiver wallets: ', (numReceivers) => {
            let receiverWallets = [];
            let count = 0;

            const askReceiverWallet = () => {
                if (count < numReceivers) {
                    rl.question(`Enter receiver wallet address ${count + 1}: `, (receiverWallet) => {

                        // Skip adding the wallet if it matches the excluded wallet
                        if (receiverWallet.toLowerCase() === excludedWallet.toLowerCase()) {
                            console.log('This wallet is excluded from transfers. Skipping...');
                        } else {
                            receiverWallets.push(receiverWallet);
                        }
                        
                        count++;
                        askReceiverWallet(); // Continue asking for more wallets
                    });
                } else {
                    rl.question('Enter the amount to transfer (in ETH): ', (amountToSend) => {
                        rl.question('Enter the interval time (in milliseconds): ', (intervalTime) => {
                            const amountInWei = ethers.utils.parseEther(amountToSend);

                            console.clear();

                            var figlet = require('figlet');

                            figlet.text('TX - Bot', {
                                font: 'Standard',
                                horizontalLayout: 'default',
                                width: 40,
                                whitespaceBreak: false
                            }, function (err, data) {
                                if (err) {
                                    console.log('Something went wrong...');
                                    console.dir(err);
                                    return;
                                }
                                console.log(data);
                            });

                            provider.once('block', (transaction) => {
                                console.log("Wallet Balance Auto Sender / Address Cleaner\n");
                                console.log("- https://github.com/hanzvibes/tx-bot\n");
                                console.log("Current Network State :\n");
                                console.log("Block Number : ", transaction);
                            });
                            provider.getGasPrice().then((gasPrice) => {
                                gasPriceString = gasPrice.toString();
                                console.log("Current Gas Price : ", gasPriceString);
                                console.log("\n");
                            });

                            const txBot = async () => {
                                provider.on('block', async () => {
                                    const { chainId, name } = await provider.getNetwork();
                                    console.log('<', name, '>', 'Waiting for transaction...');

                                    for (let i = 0; i < privateKeys.length; i++) {
                                        const _signer = new ethers.Wallet(privateKeys[i]);
                                        const signer = _signer.connect(provider);

                                        let nonce = await provider.getTransactionCount(signer.address, 'pending');

                                        const balance = await provider.getBalance(signer.address);
                                        const txBuffer = ethers.utils.parseEther("0.0005");

                                        if (balance.sub(txBuffer) >= amountInWei) {
                                            console.log('<', name, '>', "New balance detected...");
                                            console.log('<', name, '>', "Sending....");
                                            console.log('<', name, '>', "Waiting transaction hash...");

                                            for (let j = 0; j < receiverWallets.length; j++) {
                                                try {
                                                    const transaction = await signer.sendTransaction({
                                                        nonce: nonce,
                                                        to: receiverWallets[j],
                                                        value: amountInWei,
                                                        gasLimit: ethers.utils.hexlify(100000), // 100 Gwei
                                                        maxPriorityFeePerGas: ethers.utils.parseUnits('1', 'gwei'),
                                                        maxFeePerGas: ethers.utils.parseUnits('1', 'gwei')
                                                    });
                                                    console.log(transaction);

                                                    nonce++;
                                                } finally {
                                                    console.log('<', name, '>', "Success ✓");
                                                    console.log('<', name, '>', `Total amount sent: ${ethers.utils.formatEther(amountInWei)} ETH to ${receiverWallets[j]}`);
                                                }
                                            }
                                        } else {
                                            console.log('<', name, '>', `Insufficient balance to send ${ethers.utils.formatEther(amountInWei)} ETH`);
                                        }
                                    }
                                });
                            };

                            setInterval(txBot, intervalTime);
                        });
                    });
                }
            };

            askReceiverWallet();
        });
    });
});
