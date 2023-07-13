module.exports = {
	apps: [{
		name: "skycloud",
		script: "server.js",
		env_production: {
			NODE_ENV: 'production'
		}
	} ],
	deploy: {
		production: {
			key: "/Users/tobias/.ssh/id_rsa",
			user: "macmini",
			host: [ "mycloud.nu" ],
			ssh_options: "StrictHostKeyChecking=no",
			ref: "origin/main",
			repo: "git@github.com:tobiwanse/skycloud.git",
			path: "/Users/macmini/www/skycloud.nu",
			"post-deploy": "export PATH=$PATH:/usr/local/bin && cd server && npm install && pm2 startOrRestart ../ecosystem.config.js --env production"
		}
	}
}
