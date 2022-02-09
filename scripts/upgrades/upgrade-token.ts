// npx hardhat run scripts/upgrades/upgrade-token.ts --network bsctestnet

require("dotenv").config({path: `${__dirname}/.env`});
import { ethers, upgrades, run } from "hardhat";

import { AstroBirdsV2, AstroBirdzDividendTracker }  from '../../typechain';

import AstroBirdsV2Abi from '../../artifacts/contracts/AstroBirdsV2.sol/AstroBirdsV2.json'
import AstroBirdzDividendTrackerAbi from '../../artifacts/contracts/AstroBirdzDividendTracker.sol/AstroBirdzDividendTracker.json'
import { solidity } from "ethereum-waffle";
import { solidityPack } from "ethers/lib/utils";

const main = async() => {

  // const signer = ethers.provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // hardhat
  // const signer = ethers.provider.getSigner("0xCCD0C72BAA17f4d3217e6133739de63ff6F0b462"); // ganache
  const signer = ethers.provider.getSigner("0x3B7cB2006AB9F04816266CdFfaDB19210D074158"); // bsc main and test

  // const psi = "0x6C31B672AB6B4D455608b33A11311cd1C9BdBA1C"; // bsc test
  const psi = "0x6e70194F3A2D1D0a917C2575B7e33cF710718a17"; // bsc main
  
  console.log("upgrading");
  
  let astroBirdsV2 = new ethers.Contract("0x9624cd2e91504692e120802e80a313f84847dc40", AstroBirdsV2Abi.abi, signer) as AstroBirdsV2; // bsc main and test
  const AstroBirdsV2 = await ethers.getContractFactory("AstroBirdsV2");
  astroBirdsV2 = await upgrades.upgradeProxy(astroBirdsV2.address, AstroBirdsV2) as AstroBirdsV2
  await astroBirdsV2.deployed();
  console.log("AstroBirdsV2 upgraded:", astroBirdsV2.address);

  // const dividendTracker = new ethers.Contract("0xe520E54598757CF2e35B9e02210b75309e3b8091", AstroBirdzDividendTrackerAbi.abi, signer) as AstroBirdzDividendTracker; // test
  // const dividendTracker = new ethers.Contract("0x53789db481ce032B530B0a20dE940C21f5A8BD01", AstroBirdzDividendTrackerAbi.abi, signer) as AstroBirdzDividendTracker; // main
  // const AstroBirdzDividendTracker = await ethers.getContractFactory("AstroBirdzDividendTracker");
  // const dividendTracker = await AstroBirdzDividendTracker.connect(signer).deploy(psi, astroBirdsV2.address) as AstroBirdzDividendTracker;
  // await dividendTracker.deployed();
  // console.log("AstroBirdzDividendTracker deployed to:", dividendTracker.address);

  // await (await astroBirdsV2.initPSIDividendTracker(dividendTracker.address)).wait()
  // console.log("AstroBirdzDividendTracker initialized");

  const implAddress = await upgrades.erc1967.getImplementationAddress(astroBirdsV2.address)
  console.log("AstroBirdsV2 implementation address:", implAddress);
  await run("verify:verify", { address: implAddress, constructorArguments: [] });
  console.log("AstroBirdsV2 implementation verified");
  // await run("verify:verify", { address: dividendTracker.address, constructorArguments: [psi, astroBirdsV2.address] });
  // console.log("AstroBirdzDividendTracker verified");

  // const holders = [
  //   // "0x01b9ad73213684de91e75e31c5aafad7b7dea86e", "0x02d5d1e38f9fa211ee2245fcc4cd7d2f5437acf9", "0x03ac741bccaa2b80a64fc16cf1b4a321e1a7d690", 
  //   // "0x04868666d2bd162b306102d1c90a911fa8a01af4", "0x04c04c3662b1ba3d7954e4c795c19178c3793341", "0x05159afb963468427c0b4cd08645e6dc9fca2ee7", 
  //   // "0x07ef06509e59145ba8c1c5f394a656bef21ed4d9", "0x084914e307ca7cb8d083fb9212e4210ede828b21", "0x0de474b90dbddb1f6b57edbbdaa8ca108a5852ce", 
  //   // "0x0e03447e83409b3df58f7a565d28e50e3c18db2b", "0x103b0b19f3424eca7a7c4610bff0de7bf3e2cd15", "0x1271bf00454b2897e375e5d9cd9a4022f5001b74", 
  //   // "0x140b4fd7e14f21315ee800429e5eab9a79068f89", "0x1531fccb407de137ab39520d679a42ec74f86c88", "0x1662826db949f33f94bf6078fea9ec621e1bb13f", 
  //   // "0x1721c16c3d7fc61bd0d53d7dba60dc25c2dbeeab", "0x18ae049a803c8ed5f6b2aa5ff6e8c138e59e776d", "0x18ea4ab45b290e55961989e8b18f5a13a6c5123e", 
  //   // "0x1901cbef0fd7b96cda46637f8780d990fe99113e", "0x1b761025602d8b3663b7768eb2b0711f1e482dbf", "0x1c0bb5b15975b8ece686319e5878bbe605692651", 
  //   // "0x1e6b059b78a65959ab5b7e483e174f4206f30735", "0x1fd4024159760ceeac10c112ec6136848c87757e", "0x205a2d1425276064228738c00b1e736b9573f270", 
  //   // "0x21d9c92cc2c13646be489a6478a991bcc1a04353", "0x223651715c7b24bed11a41e154cc87b8cddd4480", "0x234b44504fadc5454af7fb966fc5f8d346303503", 
  //   // "0x2351c73167848ee92937b385442a14b0f7f95c6e", "0x2593691c07ab88b40cd168854203a4bce01d8843", "0x259bb22963779266f8261be8adb13f4afe820eb0", 
  //   // "0x2668bdbf77b5365abf218963b3222882aa419167", "0x29b79c43f2f375357db71ddc74770c8487ec215b", "0x2aca9f71e0a8e716b479e56e7179e244d4136cf5", 
  //   // "0x2ca686bbb4c70433c3f654480368b374c37f1fda", "0x2db2b8ec3a570dd4089c63457ba57a6d3fede7d4", "0x2e8224bed788bcf06a32976039800aa9b9e8b9e0", 
  //   // "0x32742901a4ee5c7cbf87cc1bcdf6ef3794b8d07b", "0x32a84514e42191f7e9fb00bb1c454fbc20b7e434", "0x335ddc4926791a8f3bfdaed93f85f0a15bfb46ba", 
  //   // "0x3379eb1c5c6e09f3b21b2c3bb015ff06fd0ed85d", "0x3438724a88c9696dbefd3d39c7b3cfb5082ed0a2", "0x345b4cba6c8abadc6677e9bfe70623243bcd3ec4", 
  //   // "0x34e78af4f08108adb05bff95d6e675418e5ec6a7", "0x3589a2c85a2fc33361d1c108cb1350da475b6aa6", "0x3622a0171cb41881fe5872a4e711ce41deff84f6", 
  //   // "0x369d56fb013cda74bbf4a017066498ef0adaf3be", "0x39be17456998522eb886c1c983f4da7a2ef7445e", "0x3b7cb2006ab9f04816266cdffadb19210d074158", 
  //   // "0x3c8713e0677cb87230e766c1145e7aec81e414cb", "0x3d2d12ace81e11f9c3dd90d93d4073f9391c6d81", "0x3f903d9fd548ef8ed1fe3fb1de01dbb5e2ebc5d0", 
  //   // "0x3fbf666f9dd2d15fd16ea9eba5b2234d8d159a10", "0x413975c3f79d0ab90b64834f45e795e47fd15fe8", "0x41bbf2256abed7046ea86d9ccc6857b6f2d2a2da", 
  //   // "0x4421f268d112ba35b6d63a43d392327f2f4003b9", "0x4497ffc1f09cae1c9d1a318be72a54583d57101d", "0x461abb509f2d017d4a2091a7c91b583282fd148d", 
  //   // "0x4793e1f00d94fe89dcc8af1ab4b3625ee9032365", "0x47af52916767f0550aee8035b5b14a1ece2b34f4", "0x487ce5450a34919ba38b6bb5cb65700280b65b4c", 
  //   // "0x4b8bbff4c6b37081fc9f9af471e2f98c1d93ef30", "0x4bc02426ffbddf91d56d460317ccb719c7a3c03c", "0x4bdb0a10b666b104f6761509f6ba794a329980cf", 
  //   // "0x4c8a92f51340d0d94a2d1f76a4d35bec1049e151", "0x4fce8ae549ef8f8ad8904f358b21409722f3869e", "0x50e5d45509d35a47347f4ee5aac0cad7bf6307b4", 
  //   // "0x50e67871af37e93f19cfe7a21deb7d65908a8b65", "0x50ee66ffe09f1007c86e7f41a8faa4b22f447097", "0x522344755528759c4f84a25c657f688b5429c54c", 
  //   // "0x57ec5b51ef4498a6cbf719d8749238ba3f72dc78", "0x594e7b26ab795fea3662159648a59319c02a8be6", "0x59542df7e0ab4ad998a3f7ea8bdc142b94d714fe", 
  //   // "0x5bc94537a14168f55c99a95ad1cf565f26f0c6f9", "0x5cff029b1d0ca874358e4a4669b7eabd5212e520", "0x5d716687214db4c2ce6e8ea0be242ec7f200957f", 
  //   // "0x5df3478b0ad2b6b9083521edec5c0e75f3e3f334", "0x63f35ca509b07e32b43a0700ba60fe98d86d5df1", "0x64325e5c244080fbcc950f289d44f92e26800491", 
  //   // "0x65c70980e91e2b442e00efe8e07f28dca4468fb8", "0x67dd99c3a02953113d26a636ccf87b4be58eb865", "0x6858b4606be7b61803bad39d4944895a4542ebfa", 
  //   // "0x686ebb0b78bad85505a111bd622c2d98004d75c8", "0x698cea4e68bb4e7e9e4526feeca5de401aabb7ba", "0x6ab1a8e09cfc6c983ba1ca18b8f4df54ea043fea", 
  //   // "0x6c0bd75428cbfe64068d62567ba32c4b046d39d1", "0x6e002cb3fcde089154472606b305e7ee96f04a50", "0x6fc459207e0012cd80432c6c6dca0d81083767f3", 
  //   // "0x6fe00ab2ba1e46ad3bb480d2483e7ed4b188ee7a", "0x7039dbd1373beb74b83f9f31df32fadb8f92b978", "0x719b36c54417381c9505500987779091616da683", 
  //   // "0x71e6bdf7793dd49c8d5565d664e5c410df87940a", "0x73b7c013ebb3109ae1486852972de1f76c99902c", "0x74aebf528c3d31adb98b2ea009082df2bc3d392a", 
  //   // "0x75e0c1ae408858db2ff6a102be27ef67925e05fe", "0x76492dcab762a69c926da7f2a6949a1ec4b8d5b4", "0x771b868f39d1fef09ac7c7f19c5ca79722f54898", 
  //   // "0x785e8601e48fd0f4ac811321df02d26c0c04dadd", "0x78f88b22992bdda6309163647e8d22f2cbd69157", "0x79f51a5a4487e1623dbf4eff684c952103194aa1", 
  //   // "0x7d685a48ea1d845eafe5983dbb5ec221a5918dd0", "0x7d9743542b57fc6af5ab991adfddcc1038450535", "0x7fe9b3073dd6cc6fd1ecad0655ccc892903d163b", 
  //   // "0x8123c54275578078f2280c0484d73299f930fd2b", "0x81357822ca6807c44499a00d682cc38b5e060ebd", "0x82c93b28d3cf990351a243c717f5bbe264da3690", 
  //   // "0x84367c89490e9bfd47f632dc1aea480a3a98fc96", "0x85e797a03a9e7e7975f6223d8a475f1baa532edd", "0x860c94cf294fba7e46901117cb59a8e8a6f3f745", 
  //   // "0x862c6f0373ac129fc66a324b234943139ca10c92", "0x867bd8bcaf19de8da3d192cdff07c7269161fb9f", "0x877dbf4518981c54bd3a59f21440d6c21e457ea0", 
  //   "0x884d67fe7b50e436700989db2e25af7c484ae4b4", "0x885f6703100947a0f9bb7bec3650820a2c2e11b9", "0x8a55339b720a4ec7d69ab974aec72d552eb9d701", 
  //   "0x8a5bce7ab4c38b0cab8a3dce349ffcc99dedcab4", "0x8a935de8b48dc2c0fe759add2ec7b4312f4bae71", "0x8ae9f512803b1ab79a5cdb69f0849d3b8a848f19", 
  //   "0x8c35c0b6ddcf699a1e66a49abd8a334aba4cce13", "0x8d2c6d705d7840526474eca38eac9ce21da80855", "0x8da44630a769669e8e05c7f23b1ec1218aed72be", 
  //   "0x908d8335155f2a2921557b3d30152401e5f4c923", "0x90a61168f0102174ba3e00cafd75eba473450857", "0x90cbbee109fe3e83aec227a5a9882a4a4de7d441", 
  //   "0x922f8ca1b5a6c744a07b81e73a5e1b8e74dfcb1b", "0x92c33e464f130c2b5bed44344e83ad63142a04f8", "0x933ce756575df42e8fe5098d470bc8d59d935953", 
  //   "0x93f2e35f92d7b5907a391dab92aa50c2ad1c873f", "0x945e75f0f98f86ac2b29aac2e8cfc8554e4c2438", "0x94e7c7acf27c7c0336144c6a2e757cc2e7c67fbf", 
  //   "0x961b18e499ab876b3da89870761de47bf860489b", "0x9624cd2e91504692e120802e80a313f84847dc40", "0x962736d8fdd595af122710e01657aa0d3c413728", 
  //   "0x974fb54bdd10a4b104b8ed2185840ddde8242770", "0x97cf585f32caab0150cf79fa7e81dfb9a7f68a52", "0x98d44ef70e87f783f4249eef804fd6477121b1a6", 
  //   "0x992aa4521f923775a916aea9408f1547c37d4ffa", "0x9acd869dd0e1137398d528f3cccb4553c6c25746", "0x9b5eca2ff3c249519dc3dd3bdd4817a9d3f73521", 
  //   "0x9bab959f6836bcac036b4d86da56621ff1e4cb63", "0x9bf7cca83b469bcc79992b18cbb68722560f73c7", "0x9c21b0cce26a64b64cdb02f0eda4b355277ab873", 
  //   "0x9cf9b28b64d8e58ff2d939a70c5a3fd558eec57f", "0x9fa202a7253c92cbadfc4bc11854e4664562b1db", "0xa1a8afba1de3ce24162efa9051915ddd2c60225e", 
  //   "0xa24825a3d833b4211238c31189c0adc482d40e19", "0xa2709c2b4009394f90b86de9a7d6358628c6a9cd", "0xa2b8e273ae63a7ddaec9bcbb357d63f976c5a465", 
  //   "0xa401a012bfeddfae7db7311de252c3b068ffc024", "0xa5d0ca68d64474af320e3a9a2b67d88ba896514c", "0xa5e9cd533395cb74b1c9632c2134994844135206", 
  //   "0xa5f80c09cbd98fd20a723a8f83f7479671534c54", "0xa634ab0e33665ded7f52aef07e9c7dcee97928d9", "0xaa5cb1f92d36847f279c22f66b92023974245006", 
  //   "0xad517ccd3e03919ed293669a5c34d591b6ad5c2a", "0xb1e1220ac325001ed8741d0be43e3a481a9b2713", "0xb3221d34febeffde8648139dff0d90af6b5dfda3", 
  //   "0xb33143717380d4653263861a7fcd05df59a9a9de", "0xb37f34578495114f1b54edad0bd877f2ae31ce60", "0xb5dec8ee76b489d4ed2ec43c1029cbc095005452", 
  //   "0xb673d47dfea035919492ce03f9314d3aa6068de1", "0xb778c90529ef1888ff15a2552348598574a37995", "0xb8542a01286ff847fbc481f626e609540226a447", 
  //   "0xbc2a5fd784f4875ed98ae1af637bbd73df6400d1", "0xbe81ebb297fc326f1d4603cf892a5b95133456d9", "0xbecbac3211bf358c360158b167615e8e7efecfb7", 
  //   "0xbf9e10091754cc87de07abcaf8fcfab2e3242b4c", "0xc020d84c0411eaf7336b6e3d4321cddcf3cb3439", "0xc1af30ccac045a025849b997f9b0dcef7c0d124d", 
  //   "0xc25fdbd06b94a838c7d5192badd45be070eafe3b", "0xc262c98d81b0e5a98e7796d9eff03be61ec98c17", "0xc277848f5b33683a6fd431e2b00fb08057ee81c4", 
  //   "0xc488fa9d24da1b32e90b4bc6dbecf2a216adb276", "0xc604c6eb604ce9b4e10ab55178231972be4f4cb9", "0xc95d638c7502df49d7f69db931f9d9cf5d79b924", 
  //   "0xca39f432ae39280635e70cae350f20808050d74e", "0xcaabf8a7753b5bae6347694dbe0cd4115926013f", "0xcb7a2e68a6371800baacc1aae1f7a7608b1cd8c5", 
  //   "0xcc50c32154af1519f5cae37b725690afa577d954", "0xcc840bbfceaf7801500d47b153d824509ce63da0", "0xcd02ac50df10ba43d81f2479bbf77f25b60a2257", 
  //   "0xcde6c451a1c307cc4b6ed9d3c2d8d5d08794cb11", "0xd1bb19eb4cb63b0e4d6d3fdc070c2169b415668b", "0xd20d6e8e07e4442465c6ec1b57111f2ba28aaabd", 
  //   "0xd243d3653ae262e2a42e78bfe9784025efc94db3", "0xd3a00bfedd4100dfda7ec600f1f5a5b365eea7fe", "0xd59753e93827e7d709ce7fddb205d8d77b828025", 
  //   "0xd5b3b7f81ba6fd9705cab64504124ac343c3d966", "0xd624d504f313cb535ec7e8a2ccc05c4c16313959", "0xd669617b0cf95819bb5b923810b0bc3e908ddd9b", 
  //   "0xd71039230cacbc5172a75bfe912417af5ef18cae", "0xd8b13151f65f510ba3f53de4093968b320eb49af", "0xda5e9c6976b29ec8dd75c1685499cdfd8c2e0289", 
  //   "0xdb2bb7c3de0d5ebf74e9f3d0943863abf1205788", "0xdc748e9129222bc7743497de455083ca8b0ea5bf", "0xdcd702898235591aa566c87f9e61d82b7fd222d9", 
  //   "0xdd094c8f7fcede76a7d724068fd73acdf9b9ea80", "0xe2bff9449ff60602dffc99479960fefb60151a87", "0xe7ff3f60336944828c18bceb5b4b4a81f96c81c4", 
  //   "0xe83222e3f497bbcfdc766be3c99113aa55c5506e", "0xeb94c4620f9e393bd31543f4fd18dd8f9406f5be", "0xec5a6e94c779f07d8a72d7422e3f88e5a4dee5e5", 
  //   "0xecd88b492c1b9527f7fafaa61157f4a16c0c43b8", "0xee8e4ab7e7d0ef32e83a1c6f4dee04cd2b00a8dd", "0xef8487d1109a13d5d18175b371a79cfd3c5ef118", 
  //   "0xefeadab86115ab6aea4c8f68d5eb19bc6111d39b", "0xf38b740359d0a7ee22580c91e10083bb1a4988c7", "0xf42cb308c6f66ddbdeeee760335075ca3b122d68", 
  //   "0xf5bc230c8361e62a11f328e15673764282cefa37", "0xf5c3a2ab7251fe64ac0f5c60c60d4c1c64bda485", "0xf62541c70c15e0249209bbd178120a1cae68a6ec", 
  //   "0xf9d773912d8c08a8f095b5d6c38816ed1871cc1c", "0xfb5f1288a8a4dea04e6ad57da0cf8a135ed39e15", "0xfbbe9ab6b1bfc6124d9c57e6e6e8b56a8c979d0e", 
  //   "0xfd38ccc22e98ae347dcfff17c9b76b9d655562a3", "0xfd7221a4cb6c675b83ff9b7e7bcf0b49832d0ca0", "0xfe5f4cc5307e54498817e798de6b08fe201453e9", 
  //   "0xffa41cf9743b075a28fd3dd4194593842e844e68"
  // ]
  // const holdersData = holders.map((h, idx) => solidityPack(["address"], [h]).substr(idx === 0 ? 0 : 2)).join('')
  // console.log(holdersData);
  // await (await dividendTracker.ensureBalanceForUsers(holdersData, false)).wait()
  // console.log("AstroBirdzDividendTracker balances ensured:", dividendTracker.address);
}

main()
//   .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
