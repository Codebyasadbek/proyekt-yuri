<?php
/**
 * Booking form handler: validates the request and emails it to the clinic.
 *
 * Requires PHP mail() on the hosting (available on Beget, Timeweb, Reg.ru).
 * Responds with JSON for fetch() requests and redirects back for plain form posts.
 */

declare(strict_types=1);

const MAIL_TO = 'info@pinzhenstom.ru';
const MAIL_FROM = 'noreply@pinzhenstom.ru'; // must be an address on the site's own domain
const SITE_NAME = 'Пинь Чжэн';

const MAX_SHORT_FIELD = 100;
const MAX_COMMENT = 1000;
const MIN_PHONE_LENGTH = 5;

function respond(bool $ok, bool $expectsJson): void
{
    if ($expectsJson) {
        http_response_code($ok ? 200 : 400);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok]);
    } else {
        header('Location: index.html?sent=' . ($ok ? '1' : '0') . '#contact', true, 303);
    }
    exit;
}

function postField(string $key, int $maxLength): string
{
    $value = $_POST[$key] ?? '';
    if (!is_string($value)) {
        return '';
    }
    return mb_substr(trim(strip_tags($value)), 0, $maxLength, 'UTF-8');
}

/** Strips line breaks so the value is safe in a single-line context (e.g. the subject). */
function singleLine(string $value): string
{
    return trim(preg_replace('/\s+/u', ' ', $value) ?? '');
}

function encodeHeader(string $value): string
{
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    exit;
}

$expectsJson = isset($_POST['ajax']);

// Honeypot: real visitors never see this field, bots fill it in.
if (!empty($_POST['website'])) {
    respond(true, $expectsJson);
}

$name = singleLine(postField('name', MAX_SHORT_FIELD));
$phone = singleLine(postField('phone', MAX_SHORT_FIELD));
$service = singleLine(postField('service', MAX_SHORT_FIELD));
$comment = postField('comment', MAX_COMMENT);
$language = postField('lang', 5) === 'zh' ? '中文' : 'русский';
$hasConsent = !empty($_POST['consent']);

if ($name === '' || mb_strlen($phone, 'UTF-8') < MIN_PHONE_LENGTH || !$hasConsent) {
    respond(false, $expectsJson);
}

$subject = sprintf('Заявка с сайта %s: %s', SITE_NAME, $name);

$body = implode("\n", [
    'Новая заявка с сайта',
    '',
    'Имя: ' . $name,
    'Телефон / мессенджер: ' . $phone,
    'Услуга: ' . ($service !== '' ? $service : '—'),
    'Комментарий: ' . ($comment !== '' ? $comment : '—'),
    'Язык сайта: ' . $language,
    '',
    'Отправлено: ' . date('d.m.Y H:i'),
]);

$headers = implode("\r\n", [
    'From: ' . encodeHeader(SITE_NAME) . ' <' . MAIL_FROM . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

respond(mail(MAIL_TO, encodeHeader($subject), $body, $headers), $expectsJson);
