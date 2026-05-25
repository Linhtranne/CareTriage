import pytest
import importlib
import pkgutil
import sys
import os

# Helper to find all modules in a package
def find_modules(package_name):
    package = importlib.import_module(package_name)
    modules = set()
    if hasattr(package, '__path__'):
        for _, name, is_pkg in pkgutil.walk_packages(package.__path__, package.__name__ + '.'):
            modules.add(name)
    return modules

def test_domain_layer_independence():
    """Domain layer must not depend on Application, Infrastructure, or API layers."""
    import app.domain
    domain_modules = find_modules('app.domain')
    
    for module_name in domain_modules:
        mod = importlib.import_module(module_name)
        with open(mod.__file__, 'r', encoding='utf-8') as f:
            content = f.read()
            assert "app.application" not in content, f"{module_name} violates boundary: imports app.application"
            assert "app.infrastructure" not in content, f"{module_name} violates boundary: imports app.infrastructure"
            assert "app.api" not in content, f"{module_name} violates boundary: imports app.api"

def test_application_layer_independence():
    """Application layer must not depend on Infrastructure or API layers."""
    import app.application
    app_modules = find_modules('app.application')
    
    for module_name in app_modules:
        mod = importlib.import_module(module_name)
        with open(mod.__file__, 'r', encoding='utf-8') as f:
            content = f.read()
            assert "app.infrastructure" not in content, f"{module_name} violates boundary: imports app.infrastructure"
            assert "app.api" not in content, f"{module_name} violates boundary: imports app.api"
