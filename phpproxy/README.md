# PHP proxy

Proxy used for mockup site to prevent browser from sending requests to API with basic authentication, because
the API can't handle the required OPTIONS preflight request the browsers sent.

## Initializing

In src folder:

> composer install

## Running docker

For local development purpose, you can use docker as webserver.

Install docker-compose and type:

> docker-compose up

The proxy is now available at localhost
