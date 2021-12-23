import sdk from "./1-initialize-sdk.js";

const app = sdk.getAppModule(
  "0x20afc7e8281677BaF23Fb382DD4406f7D99831bf",
);

(async () => {
    try {
      // Deploy a standard ERC-20 contract.
      const tokenModule = await app.deployTokenModule({
        // What's your token's name? Ex. "Ethereum"
        name: "F1 DAO Governance Token",
        // What's your token's symbol? Ex. "ETH"
        symbol: "RACE",
      });
      console.log(
        "✅ Successfully deployed token module, address:",
        tokenModule.address,
      );
    } catch (error) {
      console.error("failed to deploy token module", error);
    }
  })();
