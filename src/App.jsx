import { useEffect, useState, useMemo } from "react";

import { useWeb3 } from "@3rdweb/hooks";
import { ThirdwebSDK } from "@3rdweb/sdk";

import { ethers } from "ethers";


const sdk = new ThirdwebSDK("rinkeby");

const bundleDropModule = sdk.getBundleDropModule(
  "0xe1CbF9B41D5c09B43DD3E778548783d03A73AAe1",
)

const tokenModule = sdk.getTokenModule(
  "0x45193d122A207C17808EF828e5F0E2C800a11676"
)

const voteModule = sdk.getVoteModule(
  "0xD3E0d14Ca8A7AfcB5A245943e1521194be5E3dd5"
)


const App = () => {

  const {connectWallet, address, error, provider} = useWeb3();
  console.log("👋 Address:", address); 

  const signer = provider ? provider.getSigner() : undefined;

  const [hasClaimedNFT, setHasClaimedNFT] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [memberTokenAmounts, setMemberTokenAmounts] = useState({});
  const [memberAddresses, setMemberAddresses] = useState([]);

  const [proposals, setProposals] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const shortenAddress = (str) => {
    return str.substring(0, 6) + "..." + str.substring(str.length - 4);
  };


  useEffect(() => {
    sdk.setProviderOrSigner(signer);
  }, [signer]);

  useEffect(() => {
    if(!address){
      return;
    }

    return bundleDropModule
    .balanceOf(address, "0")
    .then((balance) => {
      // If balance is greater than 0, they have our NFT!
      if (balance.gt(0)) {
        setHasClaimedNFT(true);
        console.log("🌟 this user has a membership NFT!")
      } else {
        setHasClaimedNFT(false);
        console.log("😭 this user doesn't have a membership NFT.")
      }
    })
    .catch((error) => {
      setHasClaimedNFT(false);
      console.error("failed to nft balance", error);
    });
}, [address]);

useEffect(() => {
  if (!hasClaimedNFT) {
    return;
  }
  
  // Just like we did in the 7-airdrop-token.js file! Grab the users who hold our NFT
  // with tokenId 0.
  bundleDropModule
    .getAllClaimerAddresses("0")
    .then((addresess) => {
      console.log("🚀 Members addresses", addresess)
      setMemberAddresses(addresess);
    })
    .catch((err) => {
      console.error("failed to get member list", err);
    });
}, [hasClaimedNFT]);


useEffect(() => {
  if (!hasClaimedNFT) {
    return;
  }

  // Grab all the balances.
  tokenModule
    .getAllHolderBalances()
    .then((amounts) => {
      console.log("👜 Amounts", amounts)
      setMemberTokenAmounts(amounts);
    })
    .catch((err) => {
      console.error("failed to get token amounts", err);
    });
}, [hasClaimedNFT]);

useEffect(() => {
  if (!hasClaimedNFT) {
    return;
  }
  // A simple call to voteModule.getAll() to grab the proposals.
  voteModule
    .getAll()
    .then((proposals) => {
      // Set state!
      setProposals(proposals);
      console.log("🌈 Proposals:", proposals)
    })
    .catch((err) => {
      console.error("failed to get proposals", err);
    });
}, [hasClaimedNFT]);

useEffect(() => {
  if (!hasClaimedNFT) {
    return;
  }

  // If we haven't finished retreieving the proposals from the useEffect above
  // then we can't check if the user voted yet!
  if (!proposals.length) {
    return;
  }

  // Check if the user has already voted on the first proposal.
  voteModule
    .hasVoted(proposals[0].proposalId, address)
    .then((hasVoted) => {
      setHasVoted(hasVoted);
      console.log("🥵 User has already voted")
    })
    .catch((err) => {
      console.error("failed to check if wallet has voted", err);
    });
}, [hasClaimedNFT, proposals, address]);

const memberList = useMemo(() => {
  return memberAddresses.map((address) => {
    return {
      address,
      tokenAmount: ethers.utils.formatUnits(
        memberTokenAmounts[address] || [0],
        18,
      ),
    };
  });
}, [memberAddresses, memberTokenAmounts]);

if (error && error.name === "UnsupportedChainIdError") {
  return (
    <div className="unsupported-network">
      <h2>Please connect to Rinkeby</h2>
      <p>
        This dapp only works on the Rinkeby network, please switch networks
        in your connected wallet.
      </p>
    </div>
  );
}

  if (!address) {
    return (
      <div className="landing">
        <h1>Welcome to F1 DAO</h1>
        <button onClick={() => connectWallet("injected")} className="btn-hero">
          Connect your wallet
        </button>
      </div>
    );
  }

   if (hasClaimedNFT) {
    return (
      <div className="member-page">
        <h1> 🏁 DAO Member Page</h1>
        <p>Congratulations on being a member</p>
        <div>
          <div>
            <h2>Member List</h2>
            <table className="card">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Token Amount</th>
                </tr>
              </thead>
              <tbody>
                {memberList.map((member) => {
                  return (
                    <tr key={member.address}>
                      <td>{shortenAddress(member.address)}</td>
                      <td>{member.tokenAmount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div>
            <h2>Active Proposals</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                //before we do async things, we want to disable the button to prevent double clicks
                setIsVoting(true);

                // lets get the votes from the form for the values
                const votes = proposals.map((proposal) => {
                  let voteResult = {
                    proposalId: proposal.proposalId,
                    //abstain by default
                    vote: 2,
                  };
                  proposal.votes.forEach((vote) => {
                    const elem = document.getElementById(
                      proposal.proposalId + "-" + vote.type
                    );

                    if (elem.checked) {
                      voteResult.vote = vote.type;
                      return;
                    }
                  });
                  return voteResult;
                });

                // first we need to make sure the user delegates their token to vote
                try {
                  //we'll check if the wallet still needs to delegate their tokens before they can vote
                  const delegation = await tokenModule.getDelegationOf(address);
                  // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
                  if (delegation === ethers.constants.AddressZero) {
                    //if they haven't delegated their tokens yet, we'll have them delegate them before voting
                    await tokenModule.delegateTo(address);
                  }
                  // then we need to vote on the proposals
                  try {
                    await Promise.all(
                      votes.map(async (vote) => {
                        // before voting we first need to check whether the proposal is open for voting
                        // we first need to get the latest state of the proposal
                        const proposal = await voteModule.get(vote.proposalId);
                        // then we check if the proposal is open for voting (state === 1 means it is open)
                        if (proposal.state === 1) {
                          // if it is open for voting, we'll vote on it
                          return voteModule.vote(vote.proposalId, vote.vote);
                        }
                        // if the proposal is not open for voting we just return nothing, letting us continue
                        return;
                      })
                    );
                    try {
                      // if any of the propsals are ready to be executed we'll need to execute them
                      // a proposal is ready to be executed if it is in state 4
                      await Promise.all(
                        votes.map(async (vote) => {
                          // we'll first get the latest state of the proposal again, since we may have just voted before
                          const proposal = await voteModule.get(
                            vote.proposalId
                          );

                          //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                          if (proposal.state === 4) {
                            return voteModule.execute(vote.proposalId);
                          }
                        })
                      );
                      // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
                      setHasVoted(true);
                      // and log out a success message
                      console.log("successfully voted");
                    } catch (err) {
                      console.error("failed to execute votes", err);
                    }
                  } catch (err) {
                    console.error("failed to vote", err);
                  }
                } catch (err) {
                  console.error("failed to delegate tokens");
                } finally {
                  // in *either* case we need to set the isVoting state to false to enable the button again
                  setIsVoting(false);
                }
              }}
            >
              {proposals.map((proposal, index) => (
                <div key={proposal.proposalId} className="card">
                  <h5>{proposal.description}</h5>
                  <div>
                    {proposal.votes.map((vote) => (
                      <div key={vote.type}>
                        <input
                          type="radio"
                          id={proposal.proposalId + "-" + vote.type}
                          name={proposal.proposalId}
                          value={vote.type}
                          //default the "abstain" vote to chedked
                          defaultChecked={vote.type === 2}
                        />
                        <label htmlFor={proposal.proposalId + "-" + vote.type}>
                          {vote.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button disabled={isVoting || hasVoted} type="submit">
                {isVoting
                  ? "Voting..."
                  : hasVoted
                    ? "You Already Voted"
                    : "Submit Votes"}
              </button>
              <small>
                This will trigger multiple transactions that you will need to
                sign.
              </small>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const mintNFT = () => {
    setIsClaiming(true);

    bundleDropModule
    .claim("0", 1)
    .catch((err) => {
      console.error("failed to claim", err);
      setIsClaiming(false);
    })
    .finally(() => {
      // Stop loading state.
      setIsClaiming(false);
      // Set claim state.
      setHasClaimedNFT(true);
      // Show user their fancy new NFT!
      console.log(
        `🌊 Successfully Minted! Check it out on OpenSea: https://testnets.opensea.io/assets/${bundleDropModule.address}/0`
      );
    });
  }

  return (
    <div className="mint-nft">
    <h1>Mint your DAO membership NFT 🏎️</h1>
    <button
    disabled={isClaiming}
    onClick={() => mintNFT()}
    >
      {isClaiming ? "Minting..!" : "Mint your NFT (FREE)"}
    </button>
    </div>
  )
};

export default App;
