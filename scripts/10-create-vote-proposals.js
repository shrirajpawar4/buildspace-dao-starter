import { ethers } from "ethers";
import sdk from "./1-initialize-sdk.js";

const voteModule = sdk.getVoteModule(
  "0xD3E0d14Ca8A7AfcB5A245943e1521194be5E3dd5"
);

const tokenModule = sdk.getTokenModule(
  "0x45193d122A207C17808EF828e5F0E2C800a11676"
);

(async () => {
  try {
    const amount = 10000;
    await tokenModule.delegateTo(process.env.WALLET_ADDRESS);
    await voteModule.propose(
      `Should the DAO mint an additional ${amount} tokens into the treasury?`,
      [
        {
          nativeTokenValue: 0,
          transactionData: tokenModule.contract.interface.encodeFunctionData(
            "mint",
            [voteModule.address, ethers.utils.parseUnits(amount.toString(), 18)]
          ),
          toAddress: tokenModule.address,
        },
      ]
    );
    console.log("✅ Successfully created proposal to mint tokens");
  } catch (error) {
    console.error("failed to create first proposal", error);
    process.exit(1);
  }

  try {
    const amount = 69;
    await voteModule.propose(
      `Should the DAO transfer ${amount} tokens from the treasury to ${process.env.WALLET_ADDRESS} for being fantastic RACER`,
      [
        {
          nativeTokenValue: 0,
          transactionData: tokenModule.contract.interface.encodeFunctionData(
            "transfer",
            [
              process.env.WALLET_ADDRESS,
              ethers.utils.parseUnits(amount.toString(), 18),
            ]
          ),
          toAddress: tokenModule.address,
        },
      ]
    );
    console.log(
      "✅ Successfully created proposal to reward ourselves from the treasury, let's hope people vote for it!"
    );
  } catch (error) {
    console.error("failed to create second proposal", error);
  }
})();