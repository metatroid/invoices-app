This is an **in progress** Django backed vagrant app with an AngularJS front-end built for helping freelancers keep track of the time they spend working on projects and then generate stylish PDF invoices based on project settings and logged time.

This is an update/rewrite of https://github.com/metatroid/intervals which is pure Rails+spaghetti UJS/AJAX.

Old version available here: http://interval.metatroid.com/

<h1>Install Instructions</h1>
<ol>
  <li>Clone the repository
  ```
  mkdir invoices; cd $_; git clone git@github.com:metatroid/invoices-app.git .
  ```
  </li>
  <li>Initialize vagrant
  ```
  vagrant up
  ```
  </li>
  <li>Open your browser to http://django.dev</li>
  <li>Django admin (http://django.dev/admin) credentials are:<br>Username: admin<br>Password: invoiceAdmin_</li>
</ol>