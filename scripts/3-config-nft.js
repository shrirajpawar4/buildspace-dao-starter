import sdk from "./1-initialize-sdk.js";
import { readFileSync } from "fs";

const bundleDrop = sdk.getBundleDropModule(
  "0xe1CbF9B41D5c09B43DD3E778548783d03A73AAe1",
);

(async () => {
  try {
    await bundleDrop.createBatch([
      {
        name: "Championship Trophy",
        description: "This NFT will give you access to F1 DAO!",
        image: readFileSync("scripts/assets/cup.png"),
      },
    ]);
    console.log("✅ Successfully created a new NFT in the drop!");
  } catch (error) {
    console.error("failed to create the new NFT", error);
  }
})()