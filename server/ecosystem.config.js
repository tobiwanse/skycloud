module.exports = {
	apps: [ {
		name: "skycloud",
		script: "serverrr.js",
		watch: true,
		watch_delay: 1000,
		ignore_watch: [ "node_modules", "cumulus", ".git", "dist", ".nova" ],
		env: {
			NODE_ENV: 'development'
		},
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
			repo: "git@github.com:tobiwanse/skycloud-server.git",
			path: "/Users/macmini/www/test.skycloud.nu",
			// "post-deploy": "export PATH=$PATH:/usr/local/bin && npm install && ls -a && pm2 startOrRestart ./server/ecosystem.config.js --env development"
			"post-deploy": "export PATH=$PATH:/usr/local/bin && npm install && ls -a && pm2 startOrRestart ./server/ecosystem.config.js --env development"
		},
		production: {
			key: "/Users/tobias/.ssh/id_rsa",
			user: "macmini",
			host: [ "mycloud.nu" ],
			ssh_options: "StrictHostKeyChecking=no",
			ref: "origin/main",
			repo: "git@github.com:tobiwanse/skycloud-server.git",
			path: "/Users/macmini/www/skycloud.nu",
			"post-deploy": 'npm install && pm2 startOrRestart ecosystem.config.js --env production'
		}
	}
}
