# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . validators import validate_file_extension_xml, validate_file_extension_config
from django.db import models
from main.models import *
from django.contrib.postgres.fields import JSONField

from . helpers import (
	user_directory_path,
	file_directory_path,
	output_directory_path
)

class Gauging(models.Model):
	# Información General
	date = models.DateField(blank=True)
	weather = models.CharField(max_length=100)
	station = models.CharField(max_length=100)
	ts = models.TimeField(blank=True)
	te = models.TimeField(blank=True)

	def __unicode__(self):
		return "%s | %s" % (self.date, self.station)
	def __str__(self):
		return "%s | %s" % (self.date, self.station)

	class Meta:
		verbose_name = "Aforo"
		verbose_name_plural = "Aforos"

class Term(models.Model):
	# Información General
	number = models.IntegerField()
	gauging = models.ForeignKey(Gauging, null=True, on_delete=models.CASCADE)
	ts = models.TimeField(blank=True)
	te = models.TimeField(blank=True)

	def __unicode__(self):
		return "%s | Periodo %s" % (self.gauging, self.number)
	def __str__(self):
		return "%s | Periodo %s" % (self.gauging, self.number)

	class Meta:
		verbose_name = "Periodo"
		verbose_name_plural = "Periodos"

class Vehicle(models.Model):
	# Type Choices: Liviano, Pesado
	VEHICLE_TYPE_CHOICES = (
	  (None, 'Seleccione una opción'),
	  (1, 'Liviano'),
	  (2, 'Pesado'),
	)
	MOVEMENT_TYPE_CHOICES = (
	  (None, 'Seleccione una opción'),
	  (1, 'GD Sentido O-N'),
	  (2, 'FR Sentido O-E'),
	  (3, 'GR Sentido N-E'),
	)
	# Información General
	term = models.ForeignKey(Term, on_delete=models.CASCADE)
	movement = models.PositiveSmallIntegerField(null=True, choices=MOVEMENT_TYPE_CHOICES)
	type = models.PositiveSmallIntegerField(null=True, choices=VEHICLE_TYPE_CHOICES)
	number = models.IntegerField()

	def __unicode__(self):
		return "%s %s %s %s" % (self.term, self.type, self.movement, self.number)

	def __str__(self):
		if self.type == 1:
			type = "Liviano"
		elif self.type == 2:
			type = "Pesado"

		if self.movement == 1:
			movement = "GD Sentido O-N"
		elif self.movement == 2:
			movement = "FR Sentido O-E"
		elif self.movement == 3:
			movement = "GR Sentido N-E"

		return "%s | %s | %s | %s" % (self.term, type, movement, self.number)

	class Meta:
		verbose_name = "Vehiculo"
		verbose_name_plural = "Vehiculos"

class Simulation(models.Model):
	# Total 16, en uso 15 archivos de configuracion
	# Informacion general
	name = models.CharField(verbose_name="Nombre", max_length=100)
	step = models.PositiveIntegerField(verbose_name="Step")
	# Archivos de configuracion
	sumo_config = models.FileField(verbose_name="Archivo sumocfg", upload_to=user_directory_path, validators=[validate_file_extension_config])
	# Foreign Key
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	# Campos de auditoria
	date_updated = models.DateTimeField(auto_now=True) # Fecha de modificación

	def save(self, *args, **kwargs):
		if self.id is None:
			saved_sumo_config = self.sumo_config
			self.sumo_config = None
			super(Simulation, self).save(*args, **kwargs)
			self.sumo_config = saved_sumo_config
		super(Simulation, self).save(*args, **kwargs)

	def __unicode__(self):
		return "%s %s" % (self.id, self.name)
	def __str__(self):
		return "%s %s" % (self.id, self.name)

	class Meta:
		verbose_name="Simulacion"
		verbose_name_plural="Simulaciones"

class SimulationFile(models.Model):
	# Informacion general
	file = models.FileField(upload_to=file_directory_path)
	simulation = models.ForeignKey(Simulation, on_delete=models.CASCADE)

	def __unicode__(self):
		return "%s" % (self.file)
	def __str__(self):
		return "%s" % (self.file)

	class Meta:
		verbose_name="Archivo"
		verbose_name_plural="Archivos"

class Output(models.Model):
	# Informacion general
	simulation = models.OneToOneField(Simulation, on_delete=models.CASCADE, primary_key=True)
	summary = JSONField()
	avg_trace = JSONField()
	avg_weight_trace = JSONField()
	avg_light_trace = JSONField()
	avg_emission = JSONField()
	avg_weight_emission = JSONField()
	avg_light_emission = JSONField()
	key_value_weight_co2 = JSONField()
	key_value_light_co2 = JSONField()
	key_value_weight_co = JSONField()
	key_value_light_co = JSONField()

	def __unicode__(self):
		return "%s %s %s" % ("Output: ", self.simulation.id, self.simulation.name)
	def __str__(self):
		return "%s %s %s" % ("Output: ", self.simulation.id, self.simulation.name)

	class Meta:
		verbose_name="Resultado"
		verbose_name_plural="Resultados"

class Logistica(models.Model):
	VEHICLE_TYPE_CHOICES = (
	  (None, 'Seleccione una opción'),
	  (1, 'Liviano'),
	  (0, 'Pesado'),
	)
	MOVEMENT_TYPE_CHOICES = (
	  (None, 'Seleccione una opción'),
	  (1, 'GD Sentido E-N'),
	  (2, 'FR Sentido E-O'),
	  (3, 'GD Sentido N-O'),
	  (4, 'GI Sentido O-N'),
	  (5, 'FR Sentido O-E'),
	  (6, 'GI Sentido N-E'),
	)
	# Informacion general
	id_term = models.IntegerField()
	value = models.IntegerField()
	vehicle_type = models.PositiveSmallIntegerField(null=True, choices=VEHICLE_TYPE_CHOICES)
	movement = models.PositiveSmallIntegerField(null=True, choices=MOVEMENT_TYPE_CHOICES)
	id_gauging = models.IntegerField()
	# Foreign Key
	user = models.ForeignKey(User, on_delete=models.CASCADE)

	def get_vehicle_type(self):
		choices = {
	        1: "Liviano",
	        0: "Pesado"
	    }
		return choices.get(self.vehicle_type, "¡Choices error!")

	def get_movement(self):
		choices = {
	        1: "GD Sentido E-N",
	        2: "FR Sentido E-O",
	        3: "GD Sentido N-O",
	        4: "GI Sentido O-N",
	        5: "FR Sentido O-E",
	        6: "GI Sentido N-E"
	    }
		return choices.get(self.movement, "¡Choices error!")



	class Meta:
		verbose_name="Logistica"
		verbose_name_plural="Datos de Logistica"

# class Resultados_logistica(models.Model):
# 	id_aforo = models.ForeignKey()
# 	# campos de resultado por aforo
