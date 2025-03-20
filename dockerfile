FROM node:20.18.1 

WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force
RUN npm install

RUN apt-get update && apt-get install -y postgresql-client

COPY . .

EXPOSE 3000

CMD ["npm", "start"]