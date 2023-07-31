module.exports = {
	apps: [{
		name: "skycloud",
		script: "server.js",
		cwd: "./server",
		log_date_format: "YYYY-MM-DD HH:mm Z",
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
			"pre-setup" : "npm install -g pm2@latest",
			"post-deploy": "npm install && pm2 startOrRestart ecosystem.config.js --env production --time && pm2 save && pm2 log"
		}
	}
}
