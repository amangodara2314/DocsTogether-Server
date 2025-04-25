const SALT_ROUNDS = 10;

const VERIFICATION_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email - DocsTogather</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f7;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .header {
      background-color: #4f46e5;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .body {
      padding: 30px;
      text-align: center;
    }
    .body h2 {
      margin: 0 0 10px;
    }
    .body p {
      margin-bottom: 30px;
      color: #555;
    }
    .btn {
      background-color: #4f46e5;
      color: #fff;
      padding: 12px 25px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #999;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to DocsTogather</h1>
    </div>
    <div class="body">
      <h2>Hey 👋</h2>
      <p>Thanks for signing up to <strong>DocsTogather</strong>.<br/>
      Please verify your email address to complete your registration.</p>
      <a href="{{VERIFY_LINK}}" class="btn">Verify Email</a>
    </div>
    <div class="footer">
      If you didn’t sign up for DocsTogather, you can safely ignore this email.
    </div>
  </div>
</body>
</html>`;

module.exports = { SALT_ROUNDS, VERIFICATION_HTML };
