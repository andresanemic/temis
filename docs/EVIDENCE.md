# Evidence

## Reading this evidence

The transaction links below are copied from the supplied testnet evidence files and token manifest. They point to Stellar Horizon testnet. No network requests were made while preparing this repository. The source evidence says the TEMIS agreement runs used fictional data and no real money. Testnet history may be reset; the local source receipts and hashes preserve the reported record.

## TEMIS agreement lifecycle and independent reconstruction

The receipts describe two lifecycle runs. The first run had 15 successful transactions. The corrected run had 23 transactions, 22 carrying `MEMO_HASH`, across ledgers 4989043 to 4989065. In the corrected run, the source reports milestone h1 fulfilled after an annulment correction, h2 fulfilled-unconfirmed, and h3 challenged with a losing write. An independent reconstruction matched 22 of 22 statuses and all three milestone outcomes with the implementation. The third-party reader also found a defect in comparing a party copy against the history when bodies were missing or altered; it was fixed with tests. One of 22 signatures was from an unrelated third party and was not counted as a party signature. This is one run, not a broad reliability or legal finding.

The complete history run hashes (including the first and corrected run) appear in the testnet groups below. See each transaction in Horizon to inspect its success, ledger, memo, source account, and operations.

## Testnet transactions from TESTNET_EVIDENCE.md

Every transaction hash in `_fuentes/TESTNET_EVIDENCE.md` is listed below in its source group, with a full direct Horizon link. The source file states 50 successful transactions across the groups below.

### TEMIS: full agreement lifecycle, first run (15)

- [bd459ea5fea594db726f9ac3728807f3de29779a711f131a9819c32c85f1edd4](https://horizon-testnet.stellar.org/transactions/bd459ea5fea594db726f9ac3728807f3de29779a711f131a9819c32c85f1edd4)
- [65512968234035225169cf4a920501f07005422cf84b60985fb89f4cd0827f58](https://horizon-testnet.stellar.org/transactions/65512968234035225169cf4a920501f07005422cf84b60985fb89f4cd0827f58)
- [ea0231b92194350f698eb75355955a25ed3137ded5c7f992c21992d7d5d7ad0d](https://horizon-testnet.stellar.org/transactions/ea0231b92194350f698eb75355955a25ed3137ded5c7f992c21992d7d5d7ad0d)
- [95689cb5cea3c3ae0c5a79f17cd57e028edd119eeea21b31c3e8461d887de167](https://horizon-testnet.stellar.org/transactions/95689cb5cea3c3ae0c5a79f17cd57e028edd119eeea21b31c3e8461d887de167)
- [143979b1fde532875d93dc2f63e25d064eb4d549f5a4f2a63c6f1f75f68e9a40](https://horizon-testnet.stellar.org/transactions/143979b1fde532875d93dc2f63e25d064eb4d549f5a4f2a63c6f1f75f68e9a40)
- [423974ba56ec29d3d5080679a8e86cf1c7948d67329da7436e7a042251123a73](https://horizon-testnet.stellar.org/transactions/423974ba56ec29d3d5080679a8e86cf1c7948d67329da7436e7a042251123a73)
- [86c12eedb07b7cb664d0542a3612fdc77c3da98016caab314e62feaf441b4c61](https://horizon-testnet.stellar.org/transactions/86c12eedb07b7cb664d0542a3612fdc77c3da98016caab314e62feaf441b4c61)
- [51118d23a1c5316cdeef4110a4634b056db7eb598ea1933c69c5a916215e1f6b](https://horizon-testnet.stellar.org/transactions/51118d23a1c5316cdeef4110a4634b056db7eb598ea1933c69c5a916215e1f6b)
- [56e4dbb3260e4915e6cb5bfd3442bfcc1255a9d81ec99449bfc911fecbd452e3](https://horizon-testnet.stellar.org/transactions/56e4dbb3260e4915e6cb5bfd3442bfcc1255a9d81ec99449bfc911fecbd452e3)
- [165df06b95c879cae9de38978239b0575f5cd7b828464b668d5cc92d448979d8](https://horizon-testnet.stellar.org/transactions/165df06b95c879cae9de38978239b0575f5cd7b828464b668d5cc92d448979d8)
- [493a6f1cf06bdec8e5ecb62f979230fb3fc2663b99310e79b99211a5597b756a](https://horizon-testnet.stellar.org/transactions/493a6f1cf06bdec8e5ecb62f979230fb3fc2663b99310e79b99211a5597b756a)
- [221b5bb7952cb93b46f676f870f44c4e8ab267faf318860dc15838b1b11de7c1](https://horizon-testnet.stellar.org/transactions/221b5bb7952cb93b46f676f870f44c4e8ab267faf318860dc15838b1b11de7c1)
- [e93f8718064a8f6514c342378ed5af799a75b8429a1882cfb4f598b265555a46](https://horizon-testnet.stellar.org/transactions/e93f8718064a8f6514c342378ed5af799a75b8429a1882cfb4f598b265555a46)
- [70d5c4bd4c650a31239371ca610a262bbe95fbd0771502648b1cc7f07d296dd0](https://horizon-testnet.stellar.org/transactions/70d5c4bd4c650a31239371ca610a262bbe95fbd0771502648b1cc7f07d296dd0)
- [12b84c7ede24b753bb4b8e635d0daad92e23aff37d9c5658ccd0230b9270b835](https://horizon-testnet.stellar.org/transactions/12b84c7ede24b753bb4b8e635d0daad92e23aff37d9c5658ccd0230b9270b835)

### TEMIS: corrected full lifecycle and third-party status comparison (23)

- [c4c3e3a0857b85b57f9cd4f71c55951f998491f9e876f1148cbe9f352962f48e](https://horizon-testnet.stellar.org/transactions/c4c3e3a0857b85b57f9cd4f71c55951f998491f9e876f1148cbe9f352962f48e)
- [0a3fa813db9db5b3812dfd3616633c45cbc692cf7d061ea7a19b0c688595b232](https://horizon-testnet.stellar.org/transactions/0a3fa813db9db5b3812dfd3616633c45cbc692cf7d061ea7a19b0c688595b232)
- [9901e04a88d3792e3a7c53bf92d0eb590ab00d6213c6bcf46ba047e68de02aec](https://horizon-testnet.stellar.org/transactions/9901e04a88d3792e3a7c53bf92d0eb590ab00d6213c6bcf46ba047e68de02aec)
- [436b3c757bfbb86d0058d1ce4ec5a4d28b8968cf6a3076f3f5a8880c58f79c62](https://horizon-testnet.stellar.org/transactions/436b3c757bfbb86d0058d1ce4ec5a4d28b8968cf6a3076f3f5a8880c58f79c62)
- [a574a1ee6389b6aaa6efecf18be584ef9ecea7deed64d42bb7ac4d925ce6d865](https://horizon-testnet.stellar.org/transactions/a574a1ee6389b6aaa6efecf18be584ef9ecea7deed64d42bb7ac4d925ce6d865)
- [8ec19d65a616a1bc0f37ba02f5157ee913971363bdcbcb94921ffb4dec9b6f65](https://horizon-testnet.stellar.org/transactions/8ec19d65a616a1bc0f37ba02f5157ee913971363bdcbcb94921ffb4dec9b6f65)
- [65f8d09694a32fe38d3bc77c9069058370efd363fa45b32b1028a11ff9d90fdb](https://horizon-testnet.stellar.org/transactions/65f8d09694a32fe38d3bc77c9069058370efd363fa45b32b1028a11ff9d90fdb)
- [149072fbad724c3ea82be313d750d60937f5c10728ad88fb05cb9ed6a909a7d7](https://horizon-testnet.stellar.org/transactions/149072fbad724c3ea82be313d750d60937f5c10728ad88fb05cb9ed6a909a7d7)
- [a53030f21bd6682b69cab83c026ad1e7f49b6382917493552158d2b2c80da590](https://horizon-testnet.stellar.org/transactions/a53030f21bd6682b69cab83c026ad1e7f49b6382917493552158d2b2c80da590)
- [9b44bd038cfbb7ce17fa4cc929f32d81b1e341cb8b935f78fbcc51577960a498](https://horizon-testnet.stellar.org/transactions/9b44bd038cfbb7ce17fa4cc929f32d81b1e341cb8b935f78fbcc51577960a498)
- [d5ab4540688ead20a3402cf0e4df83a471e0e2627e39af7e5cfc0e793ad645e3](https://horizon-testnet.stellar.org/transactions/d5ab4540688ead20a3402cf0e4df83a471e0e2627e39af7e5cfc0e793ad645e3)
- [8899960a63f18ba369633fdc940af1aabac346fff1ea4e0f721b88f02c6cf1e1](https://horizon-testnet.stellar.org/transactions/8899960a63f18ba369633fdc940af1aabac346fff1ea4e0f721b88f02c6cf1e1)
- [497e993973bc25ba9050559121073f7db3a88290e8e39cab32fd988adaf7ce74](https://horizon-testnet.stellar.org/transactions/497e993973bc25ba9050559121073f7db3a88290e8e39cab32fd988adaf7ce74)
- [6e5277d64a6186ae46f07dc9893e289a1284a3321152fc20a400b4326d8fa17c](https://horizon-testnet.stellar.org/transactions/6e5277d64a6186ae46f07dc9893e289a1284a3321152fc20a400b4326d8fa17c)
- [9b8f5259c456f0161e83971a23dc24cf6f27afd094ff1674a0471e312ef4d23e](https://horizon-testnet.stellar.org/transactions/9b8f5259c456f0161e83971a23dc24cf6f27afd094ff1674a0471e312ef4d23e)
- [f214ae28eb073936433480aeaeef345f6c7db626a5bde1ee6079b0b0947fb4ef](https://horizon-testnet.stellar.org/transactions/f214ae28eb073936433480aeaeef345f6c7db626a5bde1ee6079b0b0947fb4ef)
- [34ee18dbdabaed895b37c7e830e4531f1cbafdfd282400033688c32c04e2be4a](https://horizon-testnet.stellar.org/transactions/34ee18dbdabaed895b37c7e830e4531f1cbafdfd282400033688c32c04e2be4a)
- [8ae6018de2544468902af713dd38baebccd90792aa7bcb001519c81fd4129323](https://horizon-testnet.stellar.org/transactions/8ae6018de2544468902af713dd38baebccd90792aa7bcb001519c81fd4129323)
- [ee2e494877186f59388ffe38b719d79ce61a95cd5bb9c4f483ad5de1db76d04a](https://horizon-testnet.stellar.org/transactions/ee2e494877186f59388ffe38b719d79ce61a95cd5bb9c4f483ad5de1db76d04a)
- [4db430c5204abd5595f3ca316c8737c9d006268060790721a0d387ff893f6478](https://horizon-testnet.stellar.org/transactions/4db430c5204abd5595f3ca316c8737c9d006268060790721a0d387ff893f6478)
- [5c6472c9d5d3787ad00feadf31a503ba64b5cbbe1b1a9cbcef5065740005c3dd](https://horizon-testnet.stellar.org/transactions/5c6472c9d5d3787ad00feadf31a503ba64b5cbbe1b1a9cbcef5065740005c3dd)
- [ba28ca1426835dd7d12a9b1c7628a834d7450f5b75e8dfcdd239c358652b7e47](https://horizon-testnet.stellar.org/transactions/ba28ca1426835dd7d12a9b1c7628a834d7450f5b75e8dfcdd239c358652b7e47)
- [675cda89adbab94bb89bbf737bb30c83d57f380c7850b7104ade9de06d5d0a78](https://horizon-testnet.stellar.org/transactions/675cda89adbab94bb89bbf737bb30c83d57f380c7850b7104ade9de06d5d0a78)

### TEMIS: muxed payTo and operation type probes (2)

- [a7b8393c5295acfc445b857a026c016646f56ceb53193ece2ce09eebbf40830f](https://horizon-testnet.stellar.org/transactions/a7b8393c5295acfc445b857a026c016646f56ceb53193ece2ce09eebbf40830f)
- [44e0f75295004850dee7f6894d2111124d4c1a4d4e528bb777122878937a7542](https://horizon-testnet.stellar.org/transactions/44e0f75295004850dee7f6894d2111124d4c1a4d4e528bb777122878937a7542)

### TEMIS: idempotent x402 payment (1)

- [5495a053cfde91f2ac2dd4eece581fc628072416cf9007d6ca78ab3becf4273a](https://horizon-testnet.stellar.org/transactions/5495a053cfde91f2ac2dd4eece581fc628072416cf9007d6ca78ab3becf4273a)

### TEMIS: concurrent anchors (two processes, three rounds) (6)

- [72c4e3db6e42ef352263d1a2a382d2343020d071ac7a981848d057d05fff18b2](https://horizon-testnet.stellar.org/transactions/72c4e3db6e42ef352263d1a2a382d2343020d071ac7a981848d057d05fff18b2)
- [eaa79b261b4c8ef0dc4717a73fe72593d02c733e47afd121cfaa87e557fda451](https://horizon-testnet.stellar.org/transactions/eaa79b261b4c8ef0dc4717a73fe72593d02c733e47afd121cfaa87e557fda451)
- [64069991758381e8f9ca84b44ec10dfca022fdf05a69a9be714c77071396cb32](https://horizon-testnet.stellar.org/transactions/64069991758381e8f9ca84b44ec10dfca022fdf05a69a9be714c77071396cb32)
- [725ec0a7645f8cb525004b78001d9b9a6c882512588016b5232a834865efbcbf](https://horizon-testnet.stellar.org/transactions/725ec0a7645f8cb525004b78001d9b9a6c882512588016b5232a834865efbcbf)
- [2a427fea35a153ec7cec59907d885546c19b9bc60eca4357345e7393311ce357](https://horizon-testnet.stellar.org/transactions/2a427fea35a153ec7cec59907d885546c19b9bc60eca4357345e7393311ce357)
- [1e7bf39958f208824480ad2da12acb27bfbac59370427993e91fe6066b9c2bcd](https://horizon-testnet.stellar.org/transactions/1e7bf39958f208824480ad2da12acb27bfbac59370427993e91fe6066b9c2bcd)

### Vespi: live x402 payment runs (3)

- [4748d366aafa23d9a65d3367238e43c610f97d5697c58fdc5958067651f64377](https://horizon-testnet.stellar.org/transactions/4748d366aafa23d9a65d3367238e43c610f97d5697c58fdc5958067651f64377)
- [e43e1ed80675d2b7d174167765beeec1f6b5226b8bd2950fa8231e9bb31a9f91](https://horizon-testnet.stellar.org/transactions/e43e1ed80675d2b7d174167765beeec1f6b5226b8bd2950fa8231e9bb31a9f91)
- [abb968e86d8997f6f555c4efe50dd5a70671dc5064b8220a7f2ea221de7650d5](https://horizon-testnet.stellar.org/transactions/abb968e86d8997f6f555c4efe50dd5a70671dc5064b8220a7f2ea221de7650d5)

The testnet file reports that the first Vespi payment run returned `not_verified` because of a project bug and a later run verified. These are Vespi kernel/payment examples, not a TEMIS legal service. The file states that the evidence does not establish mainnet use, production readiness, multiple facilitators, or more than one payer.

## Token issuance transactions

`_fuentes/token.json` contains 102 unique transaction hashes for the $TEMIS testnet experiment, including the claimable-balance demonstration. The complete set is reproduced in manifest order below. Horizon links allow independent inspection; the local manifest and receipt identify the testnet issuer and verification results. The manifest does not map every hash to a named allocation step, so this document does not assign transaction-level meanings beyond the explicitly named claim tests in the receipt.

- [561a4a96761acc2ee0f562a31cba8f308087cafc543b609c2deb7fe2c5fea6c6](https://horizon-testnet.stellar.org/transactions/561a4a96761acc2ee0f562a31cba8f308087cafc543b609c2deb7fe2c5fea6c6)
- [db13b61fe79431284bdb5c786c950c3df3cc374aa207ab495552415e13c9478b](https://horizon-testnet.stellar.org/transactions/db13b61fe79431284bdb5c786c950c3df3cc374aa207ab495552415e13c9478b)
- [e5b0a66035033f416a935b193f3f5d9fb2a58f129fea929d648bdd7f3297da16](https://horizon-testnet.stellar.org/transactions/e5b0a66035033f416a935b193f3f5d9fb2a58f129fea929d648bdd7f3297da16)
- [e144e77db526f3a1a0e967d2cf22ac0005e1581ad75fa381ad3282260f67a728](https://horizon-testnet.stellar.org/transactions/e144e77db526f3a1a0e967d2cf22ac0005e1581ad75fa381ad3282260f67a728)
- [433ae09298f451e55e00de65697f8e6558fbb124cb0b94278550e34eac8b0f8c](https://horizon-testnet.stellar.org/transactions/433ae09298f451e55e00de65697f8e6558fbb124cb0b94278550e34eac8b0f8c)
- [2338556fafc9ece94919a991e82ce3607ec250138e5c33a988a31b84b4f3f137](https://horizon-testnet.stellar.org/transactions/2338556fafc9ece94919a991e82ce3607ec250138e5c33a988a31b84b4f3f137)
- [a438f839b81e70eadbd86e143d37c907bd35209ba1c72cb5188253699a7eff5d](https://horizon-testnet.stellar.org/transactions/a438f839b81e70eadbd86e143d37c907bd35209ba1c72cb5188253699a7eff5d)
- [02a48238adb223f05f2670b18c7e0c8654aec01b31d706ba536c9f85aa957a7e](https://horizon-testnet.stellar.org/transactions/02a48238adb223f05f2670b18c7e0c8654aec01b31d706ba536c9f85aa957a7e)
- [a6008476b6283ec029bb1a6bf3938815c37218b04143f34d2562fa561f25f7d7](https://horizon-testnet.stellar.org/transactions/a6008476b6283ec029bb1a6bf3938815c37218b04143f34d2562fa561f25f7d7)
- [8f2eece8ce65788fc10b084c09c90781e7c61c617149419d635c2461da514aa7](https://horizon-testnet.stellar.org/transactions/8f2eece8ce65788fc10b084c09c90781e7c61c617149419d635c2461da514aa7)
- [ec3f4534c3011a497579d758b5cfec13cc6de59274e493f20e3348e6810d43f5](https://horizon-testnet.stellar.org/transactions/ec3f4534c3011a497579d758b5cfec13cc6de59274e493f20e3348e6810d43f5)
- [8bdbc9cd5e87b5097e38ce37e65289e3fe6d3e53a59e692dfa5de97e1c0f00eb](https://horizon-testnet.stellar.org/transactions/8bdbc9cd5e87b5097e38ce37e65289e3fe6d3e53a59e692dfa5de97e1c0f00eb)
- [d36075027209cebf8d83e353f44e678ab0de03fe3806c76c19557f74811f49a5](https://horizon-testnet.stellar.org/transactions/d36075027209cebf8d83e353f44e678ab0de03fe3806c76c19557f74811f49a5)
- [ef5be412a6457ae133b89ad7137d4b70d75446581dbe89ac6ce6e43186313594](https://horizon-testnet.stellar.org/transactions/ef5be412a6457ae133b89ad7137d4b70d75446581dbe89ac6ce6e43186313594)
- [c3f75cee6a922a57a0da622e2a59d5dec6c86e8609416d838635708d947082ae](https://horizon-testnet.stellar.org/transactions/c3f75cee6a922a57a0da622e2a59d5dec6c86e8609416d838635708d947082ae)
- [bff675b41ead299aef52da774a4768307e5a26c92705f159086da04ffdb44334](https://horizon-testnet.stellar.org/transactions/bff675b41ead299aef52da774a4768307e5a26c92705f159086da04ffdb44334)
- [29d5a5e306dff26fb7751849c0a8346eb6e9d73b5c9e2c014685b73f9cc6e749](https://horizon-testnet.stellar.org/transactions/29d5a5e306dff26fb7751849c0a8346eb6e9d73b5c9e2c014685b73f9cc6e749)
- [3800edabe696437d168135d0a904fbf2493c4eb1aea38fd328975c97cd646233](https://horizon-testnet.stellar.org/transactions/3800edabe696437d168135d0a904fbf2493c4eb1aea38fd328975c97cd646233)
- [0332718574b2e53abec3ea628af4b7cb5a0d88756bf0e4c8d4fab0557ef636f3](https://horizon-testnet.stellar.org/transactions/0332718574b2e53abec3ea628af4b7cb5a0d88756bf0e4c8d4fab0557ef636f3)
- [14f4c0d1fb7bebcfa9f5dd32a63b0e3774cd82e7ebc438a6ec732be7fbffcc4a](https://horizon-testnet.stellar.org/transactions/14f4c0d1fb7bebcfa9f5dd32a63b0e3774cd82e7ebc438a6ec732be7fbffcc4a)
- [b198b9e79c04dcfd0bb7bfda39c4fb7bff209e8d34ec0be06b938fd28b376f9e](https://horizon-testnet.stellar.org/transactions/b198b9e79c04dcfd0bb7bfda39c4fb7bff209e8d34ec0be06b938fd28b376f9e)
- [9f8f1237db080b3bc2688c5db05c983f91c6185afa184cc5ffff832f59a42047](https://horizon-testnet.stellar.org/transactions/9f8f1237db080b3bc2688c5db05c983f91c6185afa184cc5ffff832f59a42047)
- [203d67071e35ae1d10864616574592cf21fecf04f8ac274687d708c857fe74ef](https://horizon-testnet.stellar.org/transactions/203d67071e35ae1d10864616574592cf21fecf04f8ac274687d708c857fe74ef)
- [693a78d308e16731fc3c32303c41174f5f4146877509d7e3c79519fa3c853181](https://horizon-testnet.stellar.org/transactions/693a78d308e16731fc3c32303c41174f5f4146877509d7e3c79519fa3c853181)
- [e397061812cf26c0d6e21d911764dfc7ffae81f2c87d4d74d16f739ceccb2a8f](https://horizon-testnet.stellar.org/transactions/e397061812cf26c0d6e21d911764dfc7ffae81f2c87d4d74d16f739ceccb2a8f)
- [7e8816addcb30e1bcf37655d280b0a535ae2e82ca6c4ce6dad9acb064f95d62b](https://horizon-testnet.stellar.org/transactions/7e8816addcb30e1bcf37655d280b0a535ae2e82ca6c4ce6dad9acb064f95d62b)
- [f240d86aa720c1c503289152c02ba7321d5bdd5dc29d1eebd0a9f50cc95273ff](https://horizon-testnet.stellar.org/transactions/f240d86aa720c1c503289152c02ba7321d5bdd5dc29d1eebd0a9f50cc95273ff)
- [9ab7e43e5d9fd5a8feb7522d9aeb287b09be5de3a6b8ab541faa6dba81779c0e](https://horizon-testnet.stellar.org/transactions/9ab7e43e5d9fd5a8feb7522d9aeb287b09be5de3a6b8ab541faa6dba81779c0e)
- [4cbfaa60412ac9c148ba7b5abb15f29edaf9a9fbe0052bbf29d2ef95d06edf87](https://horizon-testnet.stellar.org/transactions/4cbfaa60412ac9c148ba7b5abb15f29edaf9a9fbe0052bbf29d2ef95d06edf87)
- [b8cbe8c2e058d1cadfc6311847cedc816fec36d0cc129da2da93b74820006891](https://horizon-testnet.stellar.org/transactions/b8cbe8c2e058d1cadfc6311847cedc816fec36d0cc129da2da93b74820006891)
- [822ecc7bebc97899a510a01014309503621c4ec4d108c97db81e057e36c9b90b](https://horizon-testnet.stellar.org/transactions/822ecc7bebc97899a510a01014309503621c4ec4d108c97db81e057e36c9b90b)
- [74c4c29f83daaa82d82cc3c9ccc232b7d2f31d58201bf3bbd76c3797fd73659c](https://horizon-testnet.stellar.org/transactions/74c4c29f83daaa82d82cc3c9ccc232b7d2f31d58201bf3bbd76c3797fd73659c)
- [9d25585c9b686b24a3102dbe8f9404162d3de82bddac259ef9325e5992e625a5](https://horizon-testnet.stellar.org/transactions/9d25585c9b686b24a3102dbe8f9404162d3de82bddac259ef9325e5992e625a5)
- [8f4133743e6a03aba8f37a553674f0a0dd11ed49df4893bf01b3fb4d6505eb95](https://horizon-testnet.stellar.org/transactions/8f4133743e6a03aba8f37a553674f0a0dd11ed49df4893bf01b3fb4d6505eb95)
- [685bdf3248de4c0e36a7543f578016535855743cd370af2dbb2ad3f58b940f3e](https://horizon-testnet.stellar.org/transactions/685bdf3248de4c0e36a7543f578016535855743cd370af2dbb2ad3f58b940f3e)
- [eb8a5ac02c718af17c53059abb88c64caf901f253340666592e09988f290fc78](https://horizon-testnet.stellar.org/transactions/eb8a5ac02c718af17c53059abb88c64caf901f253340666592e09988f290fc78)
- [67c4e3d608722ac376988ac0f58895ba6b88ef431185035b11b9bb1dae0c348b](https://horizon-testnet.stellar.org/transactions/67c4e3d608722ac376988ac0f58895ba6b88ef431185035b11b9bb1dae0c348b)
- [5af9690fbe3f25d112c8519abded330f7adf88f7e99d3b23a8d8fc57bcbc9e72](https://horizon-testnet.stellar.org/transactions/5af9690fbe3f25d112c8519abded330f7adf88f7e99d3b23a8d8fc57bcbc9e72)
- [cf365bda2c885cb40661880a34bbc1e005141a09a680a6ac9909345ecffe34be](https://horizon-testnet.stellar.org/transactions/cf365bda2c885cb40661880a34bbc1e005141a09a680a6ac9909345ecffe34be)
- [9dc97481fdaefa0f4236bf0d4015fe98539de62ff71757bab61f3016e015dd5a](https://horizon-testnet.stellar.org/transactions/9dc97481fdaefa0f4236bf0d4015fe98539de62ff71757bab61f3016e015dd5a)
- [76b74a0aa9ed33bf1a18c9b957dbb81fbcd66b7d4510bad65b7267b9d9cd5e4e](https://horizon-testnet.stellar.org/transactions/76b74a0aa9ed33bf1a18c9b957dbb81fbcd66b7d4510bad65b7267b9d9cd5e4e)
- [8ab61742f97efb52a3a0d50f94d314cd12c8d31402aa98e1cd099dc3513bdc64](https://horizon-testnet.stellar.org/transactions/8ab61742f97efb52a3a0d50f94d314cd12c8d31402aa98e1cd099dc3513bdc64)
- [d44e6ec13633485816be6091b47312a04b40d6bfc03ef8d1704551aef8ca34b8](https://horizon-testnet.stellar.org/transactions/d44e6ec13633485816be6091b47312a04b40d6bfc03ef8d1704551aef8ca34b8)
- [71d742a9bd3dbc717f9fb61580c03fcf789f6b983761ee281eec6a9c147b9498](https://horizon-testnet.stellar.org/transactions/71d742a9bd3dbc717f9fb61580c03fcf789f6b983761ee281eec6a9c147b9498)
- [92ef92a772dad65b0278871a475cde6a87328274929a3e2fdf82e2e2a24c8f00](https://horizon-testnet.stellar.org/transactions/92ef92a772dad65b0278871a475cde6a87328274929a3e2fdf82e2e2a24c8f00)
- [74432e42a3e1190714afddc603bcd9e0132923b15688e4366324d8b17208fbff](https://horizon-testnet.stellar.org/transactions/74432e42a3e1190714afddc603bcd9e0132923b15688e4366324d8b17208fbff)
- [899317e60f55db51643e3e36183adaa40394f47e0602545ddb8bcb13ddd900f6](https://horizon-testnet.stellar.org/transactions/899317e60f55db51643e3e36183adaa40394f47e0602545ddb8bcb13ddd900f6)
- [468037b60ab218b91e2ca9b2d7e3821dfd5d415c4d7b50e8574da8758d877ec9](https://horizon-testnet.stellar.org/transactions/468037b60ab218b91e2ca9b2d7e3821dfd5d415c4d7b50e8574da8758d877ec9)
- [4a703b5725e9ac312c616a3f0854c6bf93abb4314e026f310b494f925102c4e8](https://horizon-testnet.stellar.org/transactions/4a703b5725e9ac312c616a3f0854c6bf93abb4314e026f310b494f925102c4e8)
- [d1ff13e7f67d388642f0416c7b87ba1edfbceb17ab42f8c093bd9933ad4fc2c9](https://horizon-testnet.stellar.org/transactions/d1ff13e7f67d388642f0416c7b87ba1edfbceb17ab42f8c093bd9933ad4fc2c9)
- [9c5a0d5003f1325b82adc0bbb0dd9235fed80f41670c91490be9d0ed3a01ae45](https://horizon-testnet.stellar.org/transactions/9c5a0d5003f1325b82adc0bbb0dd9235fed80f41670c91490be9d0ed3a01ae45)
- [b317abb8c860b00bc650e448d1c23df589b4784a39096d8005de3024c575c393](https://horizon-testnet.stellar.org/transactions/b317abb8c860b00bc650e448d1c23df589b4784a39096d8005de3024c575c393)
- [84ca3703998212b24a3cc14b790b35cb38c53717d08cac535a181ad176ab2bdb](https://horizon-testnet.stellar.org/transactions/84ca3703998212b24a3cc14b790b35cb38c53717d08cac535a181ad176ab2bdb)
- [ed742f03aa070a5a193bea3a00fa0f47d372ae64715ae97c85494ee94bfdda21](https://horizon-testnet.stellar.org/transactions/ed742f03aa070a5a193bea3a00fa0f47d372ae64715ae97c85494ee94bfdda21)
- [c9d42fd8cab8586d8e7d43a11c0a08da9b4f0acf501823fc3265dded9f2726b4](https://horizon-testnet.stellar.org/transactions/c9d42fd8cab8586d8e7d43a11c0a08da9b4f0acf501823fc3265dded9f2726b4)
- [f0d30550c3daecebe78198bcd448feb83ccd029c97b31de9c976899bd6a07a1f](https://horizon-testnet.stellar.org/transactions/f0d30550c3daecebe78198bcd448feb83ccd029c97b31de9c976899bd6a07a1f)
- [bb96683fd8dd6b9857b15474c5880d7d6f0df3cd9a4c7fad0984040bf242df70](https://horizon-testnet.stellar.org/transactions/bb96683fd8dd6b9857b15474c5880d7d6f0df3cd9a4c7fad0984040bf242df70)
- [85adc887b24564b3b67bd15e28ee2eefb4f1683c7a72b67fed3d447099cda564](https://horizon-testnet.stellar.org/transactions/85adc887b24564b3b67bd15e28ee2eefb4f1683c7a72b67fed3d447099cda564)
- [8e9ea5cdabf74ac7a0ad03c69ce802f98ce6e7cfdcf5fde68c48ba3fd947b602](https://horizon-testnet.stellar.org/transactions/8e9ea5cdabf74ac7a0ad03c69ce802f98ce6e7cfdcf5fde68c48ba3fd947b602)
- [f1ad5569e200aebb5105eb966ef6e1afb1797960f52b5758378776ee06bc546f](https://horizon-testnet.stellar.org/transactions/f1ad5569e200aebb5105eb966ef6e1afb1797960f52b5758378776ee06bc546f)
- [d1e4339285817f13695f44d58e5c01e15879aae86933ba6d526ee785668d623b](https://horizon-testnet.stellar.org/transactions/d1e4339285817f13695f44d58e5c01e15879aae86933ba6d526ee785668d623b)
- [3829df366182cf70efe84707734b377fd0634fc7fd638b11a67464441772044c](https://horizon-testnet.stellar.org/transactions/3829df366182cf70efe84707734b377fd0634fc7fd638b11a67464441772044c)
- [76f8ac91fd2080aca6231978f9b61682379e713fa19ebda961fc8e8ed41a68d5](https://horizon-testnet.stellar.org/transactions/76f8ac91fd2080aca6231978f9b61682379e713fa19ebda961fc8e8ed41a68d5)
- [52bf4b52ae4c57ee44ad215a201a4f3e2a7dfaef4748b7018444939a37a31758](https://horizon-testnet.stellar.org/transactions/52bf4b52ae4c57ee44ad215a201a4f3e2a7dfaef4748b7018444939a37a31758)
- [c7bfda1cb830fc80bbf3f14050a82da63d3aabefe8a0aea146bcec11df724141](https://horizon-testnet.stellar.org/transactions/c7bfda1cb830fc80bbf3f14050a82da63d3aabefe8a0aea146bcec11df724141)
- [2cfb419a9f82f4d129a0346c41b3eeb256af25f4e17d6fa9cad854c79fb987ad](https://horizon-testnet.stellar.org/transactions/2cfb419a9f82f4d129a0346c41b3eeb256af25f4e17d6fa9cad854c79fb987ad)
- [e8536c6dc51afa7e10c5801d42d41b557e0aeacd3ea573e6617e45b9b7a8367b](https://horizon-testnet.stellar.org/transactions/e8536c6dc51afa7e10c5801d42d41b557e0aeacd3ea573e6617e45b9b7a8367b)
- [e3f8aa29dab634bcd60eb9dc8ed969e203f208d9e338214646362325d84f5534](https://horizon-testnet.stellar.org/transactions/e3f8aa29dab634bcd60eb9dc8ed969e203f208d9e338214646362325d84f5534)
- [d66830d83bd59d23f7da698fccf7f7993e39f4d2532ad884a74df8ad0af5c1f9](https://horizon-testnet.stellar.org/transactions/d66830d83bd59d23f7da698fccf7f7993e39f4d2532ad884a74df8ad0af5c1f9)
- [4e18be6b5acfe730593a54ec9da88355d756f80b185cbbda9a5c8a3859628b0c](https://horizon-testnet.stellar.org/transactions/4e18be6b5acfe730593a54ec9da88355d756f80b185cbbda9a5c8a3859628b0c)
- [ce78f2bb69955b1fb0199e72c251f1e4f877ef41359fb675f7e5d532f7b847b2](https://horizon-testnet.stellar.org/transactions/ce78f2bb69955b1fb0199e72c251f1e4f877ef41359fb675f7e5d532f7b847b2)
- [0e291130d56c08d554136e9dc50d2fda665f3e7cdad25a2c42a6af6413259288](https://horizon-testnet.stellar.org/transactions/0e291130d56c08d554136e9dc50d2fda665f3e7cdad25a2c42a6af6413259288)
- [a365e3b28a3f9535048ec1559638b98bc1a74e7f1b5d4800e0e15446261ae2df](https://horizon-testnet.stellar.org/transactions/a365e3b28a3f9535048ec1559638b98bc1a74e7f1b5d4800e0e15446261ae2df)
- [3efe14899752e44e5ae55cbbd382082f3cae713e93e39d24cee0858975fd6728](https://horizon-testnet.stellar.org/transactions/3efe14899752e44e5ae55cbbd382082f3cae713e93e39d24cee0858975fd6728)
- [7d86a8832866e86a98a25de701c4c53931a031c1d7b237e62a7aadad3ad287eb](https://horizon-testnet.stellar.org/transactions/7d86a8832866e86a98a25de701c4c53931a031c1d7b237e62a7aadad3ad287eb)
- [19e02aad3fb5171c8f7c64c3cc53a2d56080326140b2359d65b6d146f488822e](https://horizon-testnet.stellar.org/transactions/19e02aad3fb5171c8f7c64c3cc53a2d56080326140b2359d65b6d146f488822e)
- [a7d86fef4aa4300b3b31d77b55f82b31ccb93cd7594f99a48de8aa4d68c1977b](https://horizon-testnet.stellar.org/transactions/a7d86fef4aa4300b3b31d77b55f82b31ccb93cd7594f99a48de8aa4d68c1977b)
- [86e52e1be55abeceb4236172f7e24231f0ee84cbbc60e97abde5da0a8a9580df](https://horizon-testnet.stellar.org/transactions/86e52e1be55abeceb4236172f7e24231f0ee84cbbc60e97abde5da0a8a9580df)
- [dd4496fb397186d13d92a753273efa38fc4cf0195b4011da8577662b8131053b](https://horizon-testnet.stellar.org/transactions/dd4496fb397186d13d92a753273efa38fc4cf0195b4011da8577662b8131053b)
- [62e3c0332ae97bc86351a38473fadf1710ef6bb46d157574c799c67307724f11](https://horizon-testnet.stellar.org/transactions/62e3c0332ae97bc86351a38473fadf1710ef6bb46d157574c799c67307724f11)
- [0e4b5f32c2d70cf154b763a420ef3553cf88d4cb2f7b5c0bd4910ac920b7ba0b](https://horizon-testnet.stellar.org/transactions/0e4b5f32c2d70cf154b763a420ef3553cf88d4cb2f7b5c0bd4910ac920b7ba0b)
- [aa903a543d53f900a57b992db87bfa6645e8436c3da196e65b1352cd053c90c1](https://horizon-testnet.stellar.org/transactions/aa903a543d53f900a57b992db87bfa6645e8436c3da196e65b1352cd053c90c1)
- [1e654bedc6722b9f611e12b524619ed11ad89999713a9eff405c0c0f9093258a](https://horizon-testnet.stellar.org/transactions/1e654bedc6722b9f611e12b524619ed11ad89999713a9eff405c0c0f9093258a)
- [c2c3b2a5aaf473373642b583384e307a06256197bf02717bcbbe54266948980b](https://horizon-testnet.stellar.org/transactions/c2c3b2a5aaf473373642b583384e307a06256197bf02717bcbbe54266948980b)
- [dc1f15aa20d2fbfa86d959d3890efd385a73185929cdfb05a33b2981b39d847f](https://horizon-testnet.stellar.org/transactions/dc1f15aa20d2fbfa86d959d3890efd385a73185929cdfb05a33b2981b39d847f)
- [2f97abfcc8cc34c1724d8009740e057eaccabce2aa223034e188d14ca96b63dc](https://horizon-testnet.stellar.org/transactions/2f97abfcc8cc34c1724d8009740e057eaccabce2aa223034e188d14ca96b63dc)
- [0334b01d5a3f18c2ce3c639f99fea4ed9e258a211fc36dc09a0e69e4b2939470](https://horizon-testnet.stellar.org/transactions/0334b01d5a3f18c2ce3c639f99fea4ed9e258a211fc36dc09a0e69e4b2939470)
- [640299d641ea79199a7463a953437939d398644a331ff52dc8374d2cda5c88ce](https://horizon-testnet.stellar.org/transactions/640299d641ea79199a7463a953437939d398644a331ff52dc8374d2cda5c88ce)
- [def48205a0ef2b47fc77b02a247b2567594be69bd6ff1fe09df53d36b3baf00f](https://horizon-testnet.stellar.org/transactions/def48205a0ef2b47fc77b02a247b2567594be69bd6ff1fe09df53d36b3baf00f)
- [f85a235d8835772e12be101effd3ee12afdafbe0c40fafeb14e0b565560a3c36](https://horizon-testnet.stellar.org/transactions/f85a235d8835772e12be101effd3ee12afdafbe0c40fafeb14e0b565560a3c36)
- [024fc1f9ba685d1a50e6aac344a531dd07078138100828447b07928d27e78fce](https://horizon-testnet.stellar.org/transactions/024fc1f9ba685d1a50e6aac344a531dd07078138100828447b07928d27e78fce)
- [a1aea117db10ffa1b7f9779366283dfd0245485e7371ef195c9b1a97bbbbfc83](https://horizon-testnet.stellar.org/transactions/a1aea117db10ffa1b7f9779366283dfd0245485e7371ef195c9b1a97bbbbfc83)
- [c6b91308def752b588fb0c80e1410a5ce7dbb0c1e422a54a08b2d7c9b7686e7c](https://horizon-testnet.stellar.org/transactions/c6b91308def752b588fb0c80e1410a5ce7dbb0c1e422a54a08b2d7c9b7686e7c)
- [6934bd412566fb93a3451e27a41b9223e12db22b7b4199d4615ec6c65e6b3757](https://horizon-testnet.stellar.org/transactions/6934bd412566fb93a3451e27a41b9223e12db22b7b4199d4615ec6c65e6b3757)
- [baadc9ca6732cb684ca0fb537bc68740731aa051a1c6211684bc53c029c5ad6c](https://horizon-testnet.stellar.org/transactions/baadc9ca6732cb684ca0fb537bc68740731aa051a1c6211684bc53c029c5ad6c)
- [d654562c120bd479e2a884a01563df8404a60ea5155d9035f7bef683499e9a9f](https://horizon-testnet.stellar.org/transactions/d654562c120bd479e2a884a01563df8404a60ea5155d9035f7bef683499e9a9f)
- [c05339ca59889ac8e04ba341095a69d3c4d35ee41ae3a5cea1cee197c546c0f8](https://horizon-testnet.stellar.org/transactions/c05339ca59889ac8e04ba341095a69d3c4d35ee41ae3a5cea1cee197c546c0f8)
- [3e632233665dbd06e73881cd7704e272af79e13f5faaeaaffcb4b742a07150ec](https://horizon-testnet.stellar.org/transactions/3e632233665dbd06e73881cd7704e272af79e13f5faaeaaffcb4b742a07150ec)
- [14b48ae91c06ecc5b331e3219e6799fc1c7bac189219d7c24a0d2ca2b40be254](https://horizon-testnet.stellar.org/transactions/14b48ae91c06ecc5b331e3219e6799fc1c7bac189219d7c24a0d2ca2b40be254)
- [61666195ec8b3772c30c54a7e19d02ecaef9e738f3dc389afb6a40e11f3e9d40](https://horizon-testnet.stellar.org/transactions/61666195ec8b3772c30c54a7e19d02ecaef9e738f3dc389afb6a40e11f3e9d40)
- [baeda1a2bc290df78e954722d1440f2ccb72db245cd087c54c9a840cf3b8699a](https://horizon-testnet.stellar.org/transactions/baeda1a2bc290df78e954722d1440f2ccb72db245cd087c54c9a840cf3b8699a)
- [574bbbba4ea66250a5b0a9f198032ef554d3bbb96acbdc5f3241f707711fdddd](https://horizon-testnet.stellar.org/transactions/574bbbba4ea66250a5b0a9f198032ef554d3bbb96acbdc5f3241f707711fdddd)

The early claim demonstration failed as expected with `claimClaimableBalanceCannotClaim`; the later claim succeeded. The source receipt reports an independent Horizon-only verification of issuer lock, flags, total supply, account balances, vesting balances, and zero issuer balance. See [Token](TOKEN.md) for allocation and mechanics.

## Five project receipts

| Receipt | Reported result | Limits recorded by the receipt |
| --- | --- | --- |
| Stage 1: canonical form and signatures | 56/56 local tests; 400 differential fuzz cases matched between Node and an independent Python implementation; eight small-order ed25519 points rejected | Unicode behavior depends partly on the runtime's Unicode table; strict ed25519 was not run against the full Wycheproof vector set; Andrés' certificate remained pending in the receipt |
| Stage 2: chain, first-write-wins, annulment, anchoring | 106/106 local tests, including additional cases found by review | Review found and fixed eight uncovered specification/implementation holes; the receipt states the certificate was pending |
| Stage 3: end-to-end agreement run | 23 transactions, 22 with `MEMO_HASH`; independent reconstruction matched 22/22 statuses and three milestone results | One synthetic run; third party used Horizon and a distinct implementation, but source says independence was informational rather than a different model; complete archive availability and civil identity were not proven |
| Stage 4: tests 5 to 8 | Multiplexed `payTo` rejected at `/verify`; operation-type probe observed a `payment` and `invoke_host_function` with identical `transfer` events; idempotency run recorded one facilitator call and one credit; three concurrent-anchor rounds matched the network order | One facilitator and one payer per run; the multiplexed test did not call `/settle`; late settlement conflict is detected, not prevented; same-ledger index tie-break was not exercised live |
| Stage 5: $TEMIS token experiment | 102 manifest transaction hashes; independent Horizon check reported issuer locked, flags false, supply 100,000,000, allocations and 72 vesting balances; project suite 153 tests, zero failures | Testnet only, fictional data, no market or sale; Francisco's test slot is not accepted mainnet vesting; no `stellar.toml` was published |

The 153-test count is the final suite count reported in the supplied Stage 5 receipt. Earlier stage counts are historical suite sizes, not separate suites to add together.

## How to recheck a transaction

1. Open a full hash link above in Stellar Horizon testnet.
2. Confirm the transaction hash, success or failure, ledger, source account, memo type/value, and operations shown by Horizon.
3. For agreement records, compare each `MEMO_HASH` to the digest in the corresponding local receipt and apply the canonicalization and first-write-wins rules in [How it works](HOW_IT_WORKS.md). Horizon shows the ledger transaction; reconstructing a complete record requires the full history archive and off-chain copy.
4. For token transactions, use the manifest and the named testnet issuer. Recompute total supply from account balances and verify issuer weights, flags, and claimable-balance conditions. The independent readback described by the receipt was already recorded on 3 October 2026; it was not rerun while building this public documentation.

## Español

### Cómo leer esta evidencia

Los enlaces de transacciones anteriores copian los hashes completos de las fuentes de testnet y del manifiesto del token. Apuntan a Stellar Horizon testnet. No se hicieron consultas de red al preparar este repositorio. Las fuentes indican que las corridas de acuerdos TEMIS usaron datos de fantasía y no dinero real. El historial de testnet puede reiniciarse; los recibos locales y los hashes conservan el registro informado.

### Ciclo del acuerdo y reconstrucción independiente

Los recibos describen dos corridas del ciclo completo. La primera tuvo 15 transacciones exitosas. La corrida corregida tuvo 23 transacciones, 22 con `MEMO_HASH`, entre los ledgers 4989043 y 4989065. En esta última, las fuentes informan h1 cumplido después de corregirse con una anulación, h2 cumplido no confirmado y h3 impugnado con una escritura perdedora. Una reconstrucción independiente coincidió en 22 de 22 estatus y en los tres resultados de hito con la implementación. El tercero también encontró un defecto al comparar una copia de parte con el historial si faltaban cuerpos o estaban alterados; se corrigió con pruebas. Una firma de las 22 era de un tercero ajeno y no se contó como firma de una parte. Es una corrida, no una conclusión amplia de confiabilidad ni de validez jurídica.

Los hashes completos de la corrida de historial, incluidos el primer y el segundo intento, están en los grupos anteriores. Abre cada transacción en Horizon para inspeccionar su resultado, ledger, memo, cuenta de origen y operaciones.

### Transacciones de testnet de TESTNET_EVIDENCE.md

Los 50 hashes de transacción de `_fuentes/TESTNET_EVIDENCE.md` están en la lista anterior, agrupados según su fuente y con enlaces directos completos a Horizon.

- TEMIS, primer ciclo completo: 15 transacciones.
- TEMIS, ciclo corregido y comparación independiente de estatus: 23 transacciones.
- Pruebas de dirección `payTo` multiplexada y tipo de operación: 2 transacciones.
- Pago x402 idempotente: 1 transacción.
- Anclajes concurrentes de dos procesos en tres rondas: 6 transacciones.
- Corridas de pago x402 en vivo de Vespi: 3 transacciones.

El archivo de testnet informa que el primer pago de Vespi devolvió `not_verified` por un error del proyecto y que una corrida posterior se verificó. Son ejemplos del kernel Vespi y de pagos, no un servicio jurídico TEMIS. La fuente aclara que no demuestran uso en mainnet, preparación para producción, varios facilitadores ni más de un pagador.

### Transacciones de emisión del token

`_fuentes/token.json` contiene 102 hashes de transacción únicos para el experimento $TEMIS en testnet, incluida la demostración de balances reclamables. El conjunto completo está reproducido antes de esta sección y conserva el orden del manifiesto. Los enlaces de Horizon permiten revisar cada hash; el manifiesto y el recibo local identifican la emisora de testnet y los resultados de verificación. El manifiesto no asocia cada hash a un paso de asignación nombrado, por lo que no asigno significados individuales fuera de las pruebas de reclamación que identifica el recibo.

La reclamación temprana de demostración falló como se esperaba con `claimClaimableBalanceCannotClaim`; la posterior tuvo éxito. El recibo fuente informa una verificación independiente, solo de lectura de Horizon, de la emisora bloqueada, las banderas, la oferta total, los saldos de cuentas, los balances de vesting y el saldo cero de la emisora. Consulta [Token](TOKEN.md) para ver la asignación y la mecánica.

### Cinco recibos del proyecto

| Recibo | Resultado informado | Límites consignados en el recibo |
| --- | --- | --- |
| Tramo 1: forma canónica y firmas | 56/56 pruebas locales; 400 casos de fuzz diferencial coincidieron entre Node y una implementación Python independiente; ocho puntos ed25519 de orden pequeño rechazados | El comportamiento Unicode depende en parte de la tabla Unicode del entorno; ed25519 estricto no se probó contra el conjunto completo de vectores Wycheproof; el certificado de Andrés seguía pendiente en el recibo |
| Tramo 2: cadena, first-write-wins, anulación y anclaje | 106/106 pruebas locales, incluidos casos extra encontrados en la revisión | La revisión halló y corrigió ocho vacíos de especificación e implementación; el recibo dice que el certificado seguía pendiente |
| Tramo 3: corrida integral de un acuerdo | 23 transacciones, 22 con `MEMO_HASH`; reconstrucción independiente coincidió en 22/22 estatus y tres resultados de hitos | Una corrida sintética; el tercero usó Horizon y una implementación distinta, pero la fuente dice que la independencia fue informativa, no de modelo; no se probó la disponibilidad del archivo completo ni la identidad civil |
| Tramo 4: pruebas 5 a 8 | `payTo` multiplexada rechazada en `/verify`; la prueba de tipo observó `payment` e `invoke_host_function` con eventos `transfer` idénticos; idempotencia registró una llamada al facilitador y un abono; tres rondas de anclaje concurrente coincidieron con el orden de red | Un facilitador y un pagador por corrida; la prueba multiplexada no llamó a `/settle`; un conflicto de liquidación tardía se detecta, no se evita; no se probó en vivo el desempate de índices en un mismo ledger |
| Tramo 5: experimento del token $TEMIS | 102 hashes de transacciones en el manifiesto; verificación independiente en Horizon informó emisora bloqueada, banderas desactivadas, oferta de 100.000.000, saldos por cubeta y 72 balances de vesting; suite del proyecto de 153 pruebas, cero fallas | Solo testnet, datos de fantasía, sin mercado ni venta; la ranura de prueba de Francisco no es vesting aceptado en mainnet; no se publicó `stellar.toml` |

La cifra de 153 pruebas es la última cifra de suite que informa el recibo del tramo 5. Los recuentos de tramos anteriores son tamaños históricos de la suite, no pruebas separadas que deban sumarse.

### Cómo volver a comprobar una transacción

1. Abre un enlace de hash completo de la lista en Stellar Horizon testnet.
2. Revisa el hash, si fue exitosa o fallida, el ledger, la cuenta de origen, el tipo y valor del memo y las operaciones que muestra Horizon.
3. Para los registros del acuerdo, compara cada `MEMO_HASH` con el digest del recibo correspondiente y aplica las reglas TEMIS-CF-1 y `first-write-wins` de [Cómo funciona](HOW_IT_WORKS.md). Horizon muestra la transacción del ledger; para reconstruir el registro completo se necesita el archivo íntegro del historial y la copia fuera de la cadena.
4. Para las transacciones del token, usa el manifiesto y la emisora de testnet identificada. Recalcula la oferta total a partir de saldos y verifica pesos de la emisora, banderas y condiciones de balances reclamables. El recibo ya registraba la lectura independiente el 3 de octubre de 2026; no se repitió al preparar esta documentación pública.
