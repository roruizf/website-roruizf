
<?php
$name = $_POST['name'] ;
$mail = $_POST['email'];
// $message = $_POST['message'];

$header = 'From: ' . $mail . " \r\n";
$header .= "X-Mailer: PHP/" . phpversion() . " \r\n";
$header .= "Mime-Version: 1.0 \r\n";
$header .= "Content-Type: text/plain";

$message = "This message was sent by  " . $name . ",\r\n";
$message .= "Your e-mail is: " . $mail . " \r\n";
$message .= "Subject: " . $_POST['message'] . " \r\n";
$message .= "Sent on: " . date('d/m/Y', time());

$to = 'roruizf@gmail.com';
$subject = $_POST['subject'];

mail($to, $subject, utf8_decode($message), $header);

header("Location:index.html");
?>