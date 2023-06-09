const { expect } = require('chai');
const { ethers } = require('hardhat');
const { extendEnvironment } = require('hardhat/config');


//used to convert currencies to tokens
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether');
}



describe('Escrow', () => {
    let buyer, seller, inspector, lender
    let realEstate, escrow

    beforeEach( async ()=>{
        const RealEstate = await ethers.getContractFactory('RealEstate');
        realEstate = await RealEstate.deploy();
        [buyer, seller,inspector,lender] = await ethers.getSigners();
        
       
       let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS");
       await transaction.wait();

       const Escrow = await ethers.getContractFactory("Escrow");
       escrow = await Escrow.deploy(realEstate.address, seller.address, inspector.address,lender.address);

       //approve property
       transaction = await realEstate.connect(seller).approve(escrow.address, 1);
       await transaction.wait();
       
       //list property 
       //the tokens property is so you can parse ether as a parameter in the function
        transaction = await escrow.connect(seller).list(1,buyer.address,tokens(10), tokens(5));
        await transaction.wait();
    });

    describe("Deployments", ()=>{
    it('returns NFT address', async ()=>{
        let result = await escrow.nftAddress();
        expect(result).to.be.equal(realEstate.address);
    });

    
    it('Returns seller', async () => {
                const result = await escrow.seller()
                expect(result).to.be.equal(seller.address)
            });

    it('returns inspector', async ()=>{
        let result = await escrow.inspector();
        expect(result).to.be.equal(inspector.address);
    });

    it('returns lender', async ()=>{
        let result = await escrow.lender();
        expect(result).to.be.equal(lender.address);
    });
    });

    describe("Listing", ()=>{
    it('Updates ownership', async ()=>{
       //let result = await escrow.nftAddress();
        expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address);
     });
    it('Updates as listed',async()=>{
        //escrow.isListed(1) checks if an NFT with the tag of 1 is listed in the escrow
        const result = await escrow.isListed(1);
        expect(result).to.be.equal(true);
    });
    it('Returns buyers', async()=>{
        const result = await escrow.buyer(1);
        expect(result).to.be.equal(buyer.address);
    })
    it(
        "Returns purchase price", async function(){
            const result = await escrow.purchasePrice(1);
            expect(result).to.equal(tokens(10));
        }
    );
    it(
        "Returns escrow amount", async function(){
            const result = await escrow.escrowAmount(1);
            expect(result).to.equal(tokens(5));
        }
    );
    
    });
    describe(
        "Deposits", async function(){
            it(
                "Updates contract balance", async function(){
                    const transaction = await escrow.connect(buyer).depositEarnest(1,{value: tokens(5)});
                    await transaction.wait();
                    const result = await escrow.getBalance();
                    expect(result).to.equal(tokens(5));
                }
            );
        }
    );
    describe(
        "Inspection", async function(){
            it(
                "Updates inspection status", async function(){
                    const transaction = await escrow.connect(inspector).updateInspectionStatus(1,true);
                    await transaction.wait();
                    const result = await escrow.inspectionPassed(1);
                    expect(result).to.equal(true); 
                   
                }
            );
        }
    );
    describe(
        "Approval", async function(){
            it(
                "Updates approval status", async function(){
                    let transaction = await escrow.connect(buyer).approveSale(1);
                    await transaction.wait();

                    transaction = await escrow.connect(seller).approveSale(1);
                    await transaction.wait();

                    transaction = await escrow.connect(lender).approveSale(1);
                    await transaction.wait();

                    
                    expect(await escrow.approval(1,buyer.address)).to.equal(true); 
                    expect(await escrow.approval(1,seller.address)).to.equal(true);
                    expect(await escrow.approval(1,lender.address)).to.equal(true);
                   
                }
            );
        }
    );
    describe(
        "Sale", async function(){
            beforeEach(
                async ()=>{
                    let transaction = await escrow.connect(buyer).depositEarnest(1,{value: tokens(5)});
                    await transaction.wait();
                    transaction = await escrow.connect(inspector).updateInspectionStatus(1,true);
                    transaction = await escrow.connect(buyer).approveSale(1);
                    await transaction.wait();
                    transaction = await escrow.connect(seller).approveSale(1);
                    await transaction.wait();
                    transaction = await escrow.connect(lender).approveSale(1);
                    await transaction.wait();
                    await lender.sendTransaction({to: escrow.address, value: tokens(5)});
                    transaction = await escrow.connect(seller).finalizeSale(1);
                    await transaction.wait();
                }
            );
            it(
                "Updates balance", async function(){
                     expect(await escrow.getBalance()).to.equal(0);
                }
            );
            it(
                "Transfers to NFT to buyer", async function(){
                    expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address);
                }
            );
            it(
                "Cancel sale", async function(){
                    let transaction = await escrow.connect(seller).cancelSale(1);
                    await transaction.wait();
                    expect(await escrow.getBalance()).to.equal(0);
                }
            );
        }
    );
})
    //........................................................

    // beforeEach(async () => {
    //     // Setup accounts
    //     [buyer, seller, inspector, lender] = await ethers.getSigners()

    //     // Deploy Real Estate
    //     const RealEstate = await ethers.getContractFactory('RealEstate')
    //     realEstate = await RealEstate.deploy()

    //     // Mint 
    //     let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS")
    //     await transaction.wait()

    //     // Deploy Escrow
    //     const Escrow = await ethers.getContractFactory('Escrow')
    //     escrow = await Escrow.deploy(
    //         realEstate.address,
    //         seller.address,
    //         inspector.address,
    //         lender.address
    //     )

    //     // Approve Property
    //     transaction = await realEstate.connect(seller).approve(escrow.address, 1)
    //     await transaction.wait()

    //     // List Property
    //     transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
    //     await transaction.wait()
    // })

    // describe('Deployment', () => {
    //     it('Returns NFT address', async () => {
    //         const result = await escrow.nftAddress()
    //         expect(result).to.be.equal(realEstate.address)
    //     })

    //     it('Returns seller', async () => {
    //         const result = await escrow.seller()
    //         expect(result).to.be.equal(seller.address)
    //     })

    //     it('Returns inspector', async () => {
    //         const result = await escrow.inspector()
    //         expect(result).to.be.equal(inspector.address)
    //     })

    //     it('Returns lender', async () => {
    //         const result = await escrow.lender()
    //         expect(result).to.be.equal(lender.address)
    //     })
    // })

    // describe('Listing', () => {
    //     it('Updates as listed', async () => {
    //         const result = await escrow.isListed(1)
    //         expect(result).to.be.equal(true)
    //     })

    //     it('Returns buyer', async () => {
    //         const result = await escrow.buyer(1)
    //         expect(result).to.be.equal(buyer.address)
    //     })

    //     it('Returns purchase price', async () => {
    //         const result = await escrow.purchasePrice(1)
    //         expect(result).to.be.equal(tokens(10))
    //     })

    //     it('Returns escrow amount', async () => {
    //         const result = await escrow.escrowAmount(1)
    //         expect(result).to.be.equal(tokens(5))
    //     })

    //     it('Updates ownership', async () => {
    //         expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
    //     })
    // })

    // describe('Deposits', () => {
    //     beforeEach(async () => {
    //         const transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) })
    //         await transaction.wait()
    //     })

    //     it('Updates contract balance', async () => {
    //         const result = await escrow.getBalance()
    //         expect(result).to.be.equal(tokens(5))
    //     })
    // })

    // describe('Inspection', () => {
    //     beforeEach(async () => {
    //         const transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
    //         await transaction.wait()
    //     })

    //     it('Updates inspection status', async () => {
    //         const result = await escrow.inspectionPassed(1)
    //         expect(result).to.be.equal(true)
    //     })
    // })

    // describe('Approval', () => {
    //     beforeEach(async () => {
    //         let transaction = await escrow.connect(buyer).approveSale(1)
    //         await transaction.wait()

    //         transaction = await escrow.connect(seller).approveSale(1)
    //         await transaction.wait()

    //         transaction = await escrow.connect(lender).approveSale(1)
    //         await transaction.wait()
    //     })

    //     it('Updates approval status', async () => {
    //         expect(await escrow.approval(1, buyer.address)).to.be.equal(true)
    //         expect(await escrow.approval(1, seller.address)).to.be.equal(true)
    //         expect(await escrow.approval(1, lender.address)).to.be.equal(true)
    //     })
    // })

    // describe('Sale', () => {
    //     beforeEach(async () => {
    //         let transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) })
    //         await transaction.wait()

    //         transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
    //         await transaction.wait()

    //         transaction = await escrow.connect(buyer).approveSale(1)
    //         await transaction.wait()

    //         transaction = await escrow.connect(seller).approveSale(1)
    //         await transaction.wait()

    //         transaction = await escrow.connect(lender).approveSale(1)
    //         await transaction.wait()

    //         await lender.sendTransaction({ to: escrow.address, value: tokens(5) })

    //         transaction = await escrow.connect(seller).finalizeSale(1)
    //         await transaction.wait()
    //     })

    //     it('Updates ownership', async () => {
    //         expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address)
    //     })

    //     it('Updates balance', async () => {
    //         expect(await escrow.getBalance()).to.be.equal(0)
    //     })
    // })

//.............

    

    

    
