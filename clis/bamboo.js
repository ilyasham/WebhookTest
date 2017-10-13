var git = require('git-last-commit');
var program = require('commander');
 
var axios = require('axios');


program
  .version('0.1.0')
  .option('-u, --user <user>', 'Bamboo User Name')
  .option('-p, --password <password>', 'Bamboo Password')
  .option('-h, --host [host]', 'Bamboo host', 'localhost:8085/')
  .option('-k, --key <key>', 'PROJECT_KEY-PLAN_KEY')
  .option('-e, --endpoint [endpoint]', 'App Monitor endpoint')
  .option('-c, --code <code>', 'App Monitor Code')
  .parse(process.argv);

if (!program.user) {
	console.error('user is missing:');
	process.exit(1);
}

if (!program.password) {
	console.error('password is missing:');
	process.exit(1);
}

if (!program.key) {
	console.error('key is missing:');
	process.exit(1);
}

if (!program.code) {
	console.error('code is missing:');
	process.exit(1);
}

console.info('User:', program.user);
console.info('Password:', program.password);
console.info('Key:', program.key);
console.info('Code:', program.code);
console.info('Host:', program.host);

var buildPromise = axios({
	url: '/rest/api/latest/result/' + program.key + '/latest',
	method: 'get',
	baseURL: program.host,
	auth: {
    username: program.user,
    password: program.password
  }
});
var commitPromise = new Promise(function (resolve, reject) {
	git.getLastCommit(function(err, commit) {
  	if (err) {
  		reject(err);
  	} else {
  		resolve(commit);
  	}
	});	
});

Promise.all([buildPromise, commitPromise]).then(function(results) {
  const payload = {
    build: results[0].data,
    commit: results[1]
  };
  console.info('Results:', payload)
  axios({
    url: program.endpoint + '?key=' + program.code,
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      payload: payload
    }
  }).then(function (response) {
    if (response.status === 200) {
      console.info('Response:', response.data);
      process.exit(0);
    } else {
      console.error('Webhook Failed!', response.data);
      process.exit(1);
    }
  })
  .catch(function(e) {
    console.error('Webhook Failed!', response.data);
    process.exit(1);
  });
});
