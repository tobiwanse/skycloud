module.exports = {
	apps: [ {
		name: "skycloud-dev",
		script: "server.js",
		cwd: "./server",
		watch: true,
		watch_delay: 1000,
		ignore_watch: [ "node_modules", "cumulus", ".git", "dist", ".nova" ],
		env: {
			NODE_ENV: 'development'
		}
	},{
		name: "skycloud",
		script: "server.js",
		//cwd: "./server",
		env_production: {
			NODE_ENV: 'production'
		}
	} ],
	deploy: {
		development: {
			key: "/Users/tobias/.ssh/id_rsa",
			user: "macmini",
			host: [ "mycloud.nu" ],
			ssh_options: ["StrictHostKeyChecking=no"],
			ref: "origin/main",
			repo: "git@github.com:tobiwanse/skycloud.git",
			path: "/Users/macmini/www/test.skycloud.nu",
			"post-deploy": "export PATH=$PATH:/usr/local/bin && cd server && npm install && pm2 startOrRestart ../ecosystem.config.js --env development && pm2 log"
		},
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
