from django.apps import AppConfig

class InvoicesConfig(AppConfig):
    name = 'invoices'
    verbose_name = "Invoices"

    def ready(self):
        import invoices.signals