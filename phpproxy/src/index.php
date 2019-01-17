<?php

use Proxy\Factory;
use Proxy\Response\Filter\RemoveEncodingFilter;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

require 'vendor/autoload.php';
require __DIR__ . '/testResponses.php';

// Create the proxy factory.
$proxy = Factory::create();

// Add a response filter that removes the encoding headers.
$proxy->addResponseFilter(function (Response $response) {
  $response->headers->remove('Access-Control-Allow-Origin');
  $response->headers->add(['Access-Control-Allow-Headers' => 'Authorization']);
  $response->headers->add(['Access-Control-Allow-Origin' => '*']);

  return $response;
});

// Create a Symfony request based on the current browser request.
$request = Request::createFromGlobals();

if ($request->getMethod() === 'OPTIONS') {
  header('Access-Control-Allow-Headers: Authorization');
  header('Access-Control-Allow-Origin: *');
  exit;
}

// getTestResponse(1);

// Forward the request and get the response.
$response = $proxy->forward($request)->to('https://wsilb.moviatrafik.dk' . urldecode($_GET['url']));
// $response = $proxy->forward($request)->to('https://wsilb.moviatrafik.dk' . $request->getRequestUri());

// Output response to the browser.
$response->send();
