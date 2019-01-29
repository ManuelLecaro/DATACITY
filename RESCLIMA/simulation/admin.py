# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(Gauging)
admin.site.register(Term)
admin.site.register(Vehicle)
admin.site.register(Simulation)
admin.site.register(Output)
admin.site.register(SimulationFile)
admin.site.register(Logistica)
