<?php
// Server-side contact form endpoint (LAUNCH-01 / D-07, D-08, D-09).
//
// Replaces the never-provisioned Web3Forms integration with OVH's built-in
// server-side send capability, since this is the site's only piece of
// request-time compute. Every response is JSON with a `success` boolean,
// matching the contract ContactForm.astro already expects: a 2xx status
// with success true means the message was accepted; anything else is a
// non-2xx status with success false, which fires the existing client-side
// fallback ("email me directly at ...", the D-09 requirement).
//
// Written for maximum PHP-version tolerance: OVH mutualized hosting does
// not let a site pin its PHP version, so this file avoids syntax newer than
// PHP 7.1 (scalar type hints and a `void` return type only) and never uses
// declare(strict_types=1) or an 8.1-only `never` return type.

header('Content-Type: application/json; charset=utf-8');

// CORS: GitHub Pages stays alive permanently as pre-production (D-03), so
// this endpoint is called cross-origin from https://florianlepont.github.io
// in addition to same-origin production requests once the domain cuts over.
// Only that one exact origin is ever echoed back, and only after an
// allowlist match — never a wildcard, never the raw request origin
// unchecked, and never with Allow-Credentials.
$allowedOrigins = ['https://florianlepont.github.io'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

// Single rejection path so every failure response has the same status/JSON
// shape — mirrors the client-side renderSubmissionError() single-failure-
// path convention.
function fail(int $code, string $message): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Method not allowed');
}

// Field names mirror the <form> in src/components/ContactForm.astro exactly:
// three real fields (name/email/message) plus the honeypot decoy (website).
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');
$honeypot = trim($_POST['website'] ?? '');

// Honeypot short-circuit (D-08 — the only anti-spam layer this project
// wants): pretend success and send nothing, exactly like the client-side
// isHoneypotTriggered check already does, so the detection mechanism is
// never revealed to whoever/whatever filled the decoy field.
if ($honeypot !== '') {
    echo json_encode(['success' => true]);
    exit;
}

// Required-field check, mirroring the client-side isBlank semantics —
// never trust that the client-side validation actually ran.
if ($name === '' || $email === '' || $message === '') {
    fail(400, 'Missing required field');
}

// Bound the size of the message body an anonymous caller can generate
// (ASVS V5).
if (strlen($name) > 200 || strlen($email) > 254 || strlen($message) > 5000) {
    fail(400, 'Field too long');
}

// Core header-injection defence: reject any submitted value containing a
// carriage return or line feed before any header string is built below.
// This MUST run before the header-construction lines further down — a
// newline reaching a header value is how additional recipients or headers
// get smuggled into the outgoing message.
foreach ([$name, $email, $message] as $field) {
    if (preg_match('/[\r\n]/', $field)) {
        fail(400, 'Invalid input');
    }
}

// Standard-library email format validation rather than a hand-rolled regex.
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail(400, 'Invalid email address');
}

// Recipient confirmed by the maintainer against the OVH/Zimbra mailbox list
// (see this plan's SUMMARY for the confirmation record) — never a guessed
// default.
$to = 'contact@atelierjacquelinesuzanne.fr';
$subject = 'Nouveau message depuis le site — Atelier Jacqueline Suzanne';

// The From line is a pure string literal on the site's own domain, with no
// variable interpolated into it anywhere. The apex domain's SPF record is a
// hard fail for anything not covered by its include, so putting the
// visitor's own address here would guarantee a delivery failure at the
// receiving server. The visitor's address is only ever placed in Reply-To,
// which is safe because it already passed the CRLF and format checks above.
$headers = "From: no-reply@atelierjacquelinesuzanne.fr\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$body = "Nom: {$name}\nEmail: {$email}\n\n{$message}";

// The fifth argument sets the envelope sender to the owned domain, which is
// what the receiving server's SPF check actually evaluates.
$sent = mail($to, $subject, $body, $headers, '-f no-reply@atelierjacquelinesuzanne.fr');

if (!$sent) {
    fail(502, 'Send failed');
}

echo json_encode(['success' => true]);
