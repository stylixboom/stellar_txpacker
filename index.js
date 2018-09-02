// --------------- Express server parameters ---------------
var listening_ip = '0.0.0.0';
var listening_port = 8080;

var express = require('express');
var app = express();

// --------------- Express configure ---------------
//var logger = require('morgan');
//app.use(logger('dev'));

//var bodyParser = require('body-parser')
//app.use(bodyParser.json());                         // to support JSON-encoded bodies
//app.use(bodyParser.urlencoded({ extended: true })); // to support URL-encoded bodies

// --------------- Access ---------------
// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


// --------------- Express API server initialize ---------------
var express_server = app.listen(process.env.SERV_PORT || listening_port, process.env.SERV_IP || listening_ip, function () {
    console.log('TXPX is now listening on %s:%s', express_server.address().address, express_server.address().port);
    initWalletAccount();
});

app.get('/pay', async function (req, res) {
    var ret = {};

    if (isLoaded) {
        var payResult = await payment(useChannel(), receiverPublicKey, 1);

        // Success response
        res.statusCode = 200;
        ret.message = "Success";
        ret.payResult = payResult;
        ret.error = 0;
    } else {

        // Fail response
        res.statusCode = 200;
        ret.message = "Account preparation is in progress.";
        ret.error = 1;
    }
    // Response
    res.json(ret);
});


// ================= STELLAR =================
var StellarSdk = require('stellar-sdk');

var sourceSecretKey = ['SD56DSQT2NL4ZGBCB3ULUMW7AWMSYS7LG7YKCPTENVFZIJLAITBKL2WZ',
    'SAZD3AJPYKFJ6OBKVT5NONREVDIIXCXYWLPOEOL5IAL7ZNCJRUN6XV62',
    'SC3WBVZSK4J4X6RQ6IGR4RN6Q4QQ6TXTW4IJ43EG33AJTJSLLTQYOJPY',
    'SBRB2ZTPGA47BICF5HJYPXJONL6RR7JUKA5NA2OBLKOH36ZKOMEKF3RB',
    'SD26L2GUAPJLQHHWSINNUPJQPH7H5UZW4CD6OGGPN63BTU2SE6PODE26',
    'SBLD64THHK7TIOCBV4VTY5NA4O2TT3R7KFW56O5ZAP5N5DY5YMZJBZPG',
    'SCBH576GI54RPPMRLSYUHNJBPNLNBPWJRSVUL5HSKCOWVPY25GP6K5YI',
    'SAX4FZXJVGM5TRAFA4RRYUIOS3EFFOVX4U4MDW7AMIHTYU54WZVDJI6D',
    'SBHMX5BRPVBSWESMSFGBHWZIPHM523EPUJEU4U3KD5ORYTUAJRRQS665',
    'SDPMPFRDRQCFPN4MZCHB4JVIPS3OYDTLY4AC4QDSWQHCGHU2WL7NYI6I',
    'SARJLLFXXOQCC5DFN5CACGRA77KSUIOSMGAZXRUTAOX2CFEGTWQTSKGO',
    'SAMEDKEKFGAVOPR7ZOSGXMDMBSS37YDECE4FNTENR6JZS5OCD7MYEGF6',
    'SANCOZTATQIMBL2HDWX7EOOCZNSTTJD6ACDXPSMTFC5FZIXXVABZOVPU'];
// pub GBJMSTS5GSCP72VFYLQ3MCOU7GL65DZXJ222XMFNR3M6SXMAYDXBRX6R
// GD27JXJFQENLY7ZM6SOPINLPZO4IVJSSDZFOGUCJYWM52YCM3MHEDJCY
// GBQXR2EQ2KHOH42EM4ZD77O52ZGDMV6BIGMVXUKA2FFUEXU7TSZLETUV
// GBYPILXVV57VXITAEYKG3F2ITIR7D22UJI5GGPCIIHDZUW4TCUTTCRGS
// GBZ3QMWCSZ7RK6BATK4JH2W3BPVKIV2NX3MEBECOZ3SFRGU5WBYWSNP4
// GA65DZTZ27VICMOPYJXUUUS4QN6G2GQZA4NSC7KIFDNOFWTQZHNEETO5
// GDXUCTF4YAYVRXJYDRAVIAV2U32BJG6RV7OY7NIW2NDJQLSSD6273XN6
// GDLILBSKYO6MPBBXHUPJWK5GZ3JQEPSRRSE2KRDRDBXGVTI7JS2FXSEZ
// GAE56VAT4RWOXV27RKSGJDNMFRVJOC5P5TH7LJJK3WD5L33OB3SEKDXF
// GBGV73MOB63XLSOCREFRRA3Z7B2I24365WBSPUABU6YP72JOU7MKMIBN
// GCGKFLVQBLOSHPS6CHLBMXIDGCKQLOSKRPQ2MYCG66DJ7US4CVYL7LGE
// GDBC2ZWNF5YCCITERGCTGSCSKIDTOSLPB34FAGZ3ODGAUJN3CCIYZABY

// Derive Keypair object and public key (that starts with a G) from the secret
var sourceKeypair = [];

var receiverPublicKey = 'GAYDKVXODSVFD372COOWWSEIAYOKK2YRLGBJ6PFBXOU4YBQMJYFU5V56';

// Configure StellarSdk to talk to the horizon instance hosted by Stellar.org
// To use the live network, set the hostname to 'horizon.stellar.org'
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
// StellarSdk.Network.usePublicNetwork();
StellarSdk.Network.useTestNetwork();


var txcount = 0;
var sourceAccount = [];
var isLoaded = false;
async function payment(from, to, amount) {
    amount = typeof amount === 'string' ? amount : amount.toString()

    let transaction = new StellarSdk.TransactionBuilder(from.account);

    var count = 0;
    while (count++ < 2) {
        transaction.addOperation(StellarSdk.Operation.payment({
            destination: to,
            asset: StellarSdk.Asset.native(),
            amount: amount
        }));
    }

    transaction = transaction.build();
    transaction.sign(from.keypair);

    // Let's see the XDR (encoded in base64) of the transaction we just built
    //console.log(transaction.toEnvelope().toXDR('base64'));

    // Submit the transaction to the Horizon server. The Horizon server will then
    // submit the transaction into the network for us.
    console.log("New job added channel:" + from.channelId + "(" + channelQueueSize[from.channelId] + ")" + " seq:" + from.account.sequence + " id:" + txcount + " hash:" + transaction.hash().toString('base64'));
    return q.push({ ch: from.channelId, seq: from.account.sequence, tx: transaction, id: txcount++ }, function (result) {
        console.log("Done ch:" + result.ch + " seq:" + result.seq + " id:" + result.id);
        console.log(result.url);
        // Return channel slot
        returnChannel(result.ch);
    });
}


async function initWalletAccount() {
    process.stdout.write("Please wait for loading account");

    for (var channelId in sourceSecretKey) {
        sourceKeypair.push(StellarSdk.Keypair.fromSecret(sourceSecretKey[channelId]));
        sourceAccount.push(await server.loadAccount(sourceKeypair[channelId].publicKey()));
        channelQueueSize.push(0);
        process.stdout.write(".");
    }
    if (sourceSecretKey.length === sourceKeypair.length && sourceSecretKey.length === sourceAccount.length) {
        isLoaded = true;
        console.log(" " + sourceAccount.length + " account(s) loaded!");
    } else {
        console.log(" fail to load account!");
    }
}

var channelQueueSize = [];

// Transactions require a valid sequence number that is specific to this account.
// We can fetch the current sequence number for the source account from Horizon.
function useChannel() {
    var channelId = channelQueueSize.indexOf(Math.min(...channelQueueSize));
    channelQueueSize[channelId]++;
    return {
        channelId: channelId,
        account: sourceAccount[channelId],
        keypair: sourceKeypair[channelId]
    };
}

function returnChannel(channelId) {
    return channelQueueSize[channelId]--;
}


// ===== QUEUE =====
var Queue = require('better-queue');
var q = new Queue(async function (job, callback) {

    return await server.submitTransaction(job.tx)
        .then(async function (transactionResult) {
            //console.log(JSON.stringify(transactionResult, null, 2));
            //console.log(transactionResult._links.transaction.href);

            callback({ ch: job.ch, seq: job.seq, id: job.id, url: transactionResult._links.transaction.href });
        })
        .catch(async function (error) {
            try {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.log('data:')
                    console.log(error.response.data);
                    console.log('status:');
                    console.log(error.response.status);
                    console.log('headers:');
                    console.log(error.response.headers);

                    if (error.response.data.extras.result_codes.transaction === 'tx_bad_seq') {
                        console.log('Bad sequence happened, reloading account..');
                        //q.pause();
                        //sourceAccount[job] = await server.loadAccount(fr.publicKey());
                        //q.resume();
                        console.log('Fresh account loaded!!');
                    }

                } else if (error.request) {
                    // The request was made but no response was received
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                    // http.ClientRequest in node.js
                    console.log('request:');
                    console.log(error.request);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log('Something else error:');
                    console.log(error.message);
                }
                console.log('config:');
                console.log(error.config);
            } catch (err) {
                console.log('Error of the error');
                console.log(err);
            }

            //callback();
        });
    // Will wait 5 second before taking the next task
}, { afterProcessDelay: 0, concurrent: sourceSecretKey.length })