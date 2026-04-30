# Tokki Roulette

This project is made for TokkiCorp, to have a new roulette page, since the old one turned into a subsription based service. Having a dedicated page also allows us to gather data about predictions being made, for the purpose of monthly prediction reports.

## Development

To start developing the project, you should run `npm install` in both backend and frontend folders to install required packages. The whole project can be started by running `docker-compose up -d` in the root folder, but this doesn't provide hotloading.

A hotloaded frontend can be started by running `npm run dev` in the frontend folder. There is no real good way to test backend code without a working frontend.

## Deployment

Currently deployment is done through a script that is not included in this project.