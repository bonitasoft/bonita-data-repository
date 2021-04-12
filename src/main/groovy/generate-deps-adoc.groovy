
import com.github.jknack.handlebars.*;
import com.github.jknack.handlebars.io.*;
import groovy.json.JsonSlurper;

def templateDir = properties["templateDir"]
def nodeJsDepFile = properties["nodeJsDepFile"]
def outputFileName = properties["outputFileName"]


TemplateLoader loader = new FileTemplateLoader(templateDir);
Handlebars handlebars = new Handlebars(loader);
Template template = handlebars.compile("dependencies.adoc");

def jsonSlurper = new JsonSlurper()
File nodeDepsFile = new File(nodeJsDepFile)
def nodeDeps = jsonSlurper.parse(nodeDepsFile)

def deps = []
nodeDeps.eachWithIndex { entry, index ->
	def dep = entry.key
	def name = dep.substring(0, dep.lastIndexOf('@'))
	def version = dep.substring(dep.lastIndexOf('@')+1)
	deps[index] = [
			"name": name,
			"version": version,
			"licenses": entry.value.licenses
	]
}

def data = [
		"project": [
			"name": "${project.artifactId}",
			"version": "${project.version}"
		],
		"deps": deps
]
def nodeDepsContent =  template.apply(data)

new File(outputFileName).text = nodeDepsContent
