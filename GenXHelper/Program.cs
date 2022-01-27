using System;
using System.Collections.Generic;
using System.Linq;
using Mono.Cecil;
using Newtonsoft.Json;

namespace GenXHelper
{ 
    abstract class WriteOnlyConverter<T> : JsonConverter<T>
    {
        public override T ReadJson(JsonReader reader, Type objectType, T existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }
    }

    class CustomAttributeArgumentConverter : WriteOnlyConverter<CustomAttributeArgument>
    {
        public override void WriteJson(JsonWriter writer, CustomAttributeArgument value, JsonSerializer serializer)
        {
            writer.WriteStartObject();

            writer.WritePropertyName("type");
            Program.referenceConverter.WriteJson(writer, value.Type, serializer);

            writer.WritePropertyName("value");
            serializer.Serialize(writer, value.Value);

            writer.WriteEndObject();
        }
    }

    class CustomAttributeConverter : WriteOnlyConverter<CustomAttribute>
    {
        public override void WriteJson(JsonWriter writer, CustomAttribute value, JsonSerializer serializer)
        {
            writer.WriteStartObject();

            writer.WritePropertyName("attributeType");
            Program.referenceConverter.WriteJson(writer, value.AttributeType, serializer);

            writer.WritePropertyName("constructorArguments");
            serializer.Serialize(writer, value.ConstructorArguments);

            writer.WriteEndObject();
        }
    }

    class MethodDefinitionConverter : WriteOnlyConverter<MethodDefinition>
    {
        public override void WriteJson(JsonWriter writer, MethodDefinition value, JsonSerializer serializer)
        {
            writer.WriteStartObject();

            writer.WritePropertyName("name");
            writer.WriteValue(value.Name);

            if (value.HasCustomAttributes)
            {
                writer.WritePropertyName("customAttributes");
                serializer.Serialize(writer, value.CustomAttributes);
            }

            writer.WriteEndObject();
        }
    }

    class FieldDefinitionConverter : WriteOnlyConverter<FieldDefinition>
    {
        public override void WriteJson(JsonWriter writer, FieldDefinition value, JsonSerializer serializer)
        {
            writer.WriteStartObject();

            writer.WritePropertyName("name");
            writer.WriteValue(value.Name);

            if (value.HasCustomAttributes)
            {
                writer.WritePropertyName("customAttributes");
                serializer.Serialize(writer, value.CustomAttributes);
            }

            writer.WritePropertyName("fieldType");
            Program.referenceConverter.WriteJson(writer, value.FieldType, serializer);

            writer.WriteEndObject();
        }
    }

    class PropertyDefinitionConverter : WriteOnlyConverter<PropertyDefinition>
    {
        public override void WriteJson(JsonWriter writer, PropertyDefinition value, JsonSerializer serializer)
        {
            writer.WriteStartObject();

            writer.WritePropertyName("name");
            writer.WriteValue(value.Name);

            if (value.HasCustomAttributes)
            {
                writer.WritePropertyName("customAttributes");
                serializer.Serialize(writer, value.CustomAttributes);
            }

            writer.WritePropertyName("propertyType");
            Program.referenceConverter.WriteJson(writer, value.PropertyType, serializer);

            writer.WriteEndObject();
        }
    }

    class TypeDefinitionConverter : WriteOnlyConverter<TypeDefinition>
    {
        public override void WriteJson(JsonWriter writer, TypeDefinition value, JsonSerializer serializer)
        {
            writer.WriteStartObject();

            Program.writeNameAndLocationProperties(writer, value, serializer);

            writer.WritePropertyName("kind");
            writer.WriteValue(value.IsPrimitive ? "primitive" : value.IsEnum ? "enum" : value.IsInterface ? "interface" : value.IsClass ? "class" : null);

            if (value.HasCustomAttributes)
            {
                writer.WritePropertyName("customAttributes");
                serializer.Serialize(writer, value.CustomAttributes);
            }

            if (value.IsEnum)
            {
                writer.WritePropertyName("values");
                serializer.Serialize(writer, value.Fields.Where(f => f.Name != "value__").Select(f => f.Name));
            }
            else
            {
                writer.WritePropertyName("baseType");
                Program.referenceConverter.WriteJson(writer, value.BaseType, serializer);

                writer.WritePropertyName("genericParameters");
                writer.WriteStartArray();
                foreach (var arg in value.GenericParameters)
                    Program.referenceConverter.WriteJson(writer, arg, serializer);
                writer.WriteEndArray();

                writer.WritePropertyName("interfaces");
                serializer.Serialize(writer, value.Interfaces);

                writer.WritePropertyName("methods");
                serializer.Serialize(writer, value.Methods.Where(m => !m.IsCompilerControlled && !m.IsSpecialName && !m.CustomAttributes.Any(a => a.AttributeType.Name == "CompilerGeneratedAttribute")));

                writer.WritePropertyName("properties");
                serializer.Serialize(writer, value.Properties);

                writer.WritePropertyName("fields");
                serializer.Serialize(writer, value.Fields.Where(f => !f.IsCompilerControlled && !f.IsSpecialName && !f.CustomAttributes.Any(a => a.AttributeType.Name == "CompilerGeneratedAttribute")));
            }

            writer.WriteEndObject();
        }
    }

    class TypeReferenceConverter : WriteOnlyConverter<TypeReference>
    {
        public override void WriteJson(JsonWriter writer, TypeReference value, JsonSerializer serializer)
        {
            if (value == null)
            {
                writer.WriteNull();
                return;
            }

            if(value.IsGenericParameter)
            {
                writer.WriteValue(value.Name);
                return;
            }

            writer.WriteStartObject();

            Program.writeNameAndLocationProperties(writer, value, serializer);

            //writer.WritePropertyName("kind");
            //writer.WriteValue(value.IsPrimitive ? "primitive" : value.IsArray ? "array" : null);

            if (value.IsGenericInstance)
            {
                writer.WritePropertyName("genericArguments");
                writer.WriteStartArray();
                foreach (var arg in ((GenericInstanceType)value).GenericArguments)
                    WriteJson(writer, arg, serializer);
                writer.WriteEndArray();
            }

            writer.WriteEndObject();
        }
    }

    class InterfaceImplementationConverter : WriteOnlyConverter<InterfaceImplementation>
    {
        public override void WriteJson(JsonWriter writer, InterfaceImplementation value, JsonSerializer serializer)
        {
            Program.referenceConverter.WriteJson(writer, value.InterfaceType, serializer);
        }
    }

    class GenXHelperOutput
    {
        public IEnumerable<TypeDefinition> enums { get; set; }
        public IEnumerable<TypeDefinition> classes { get; set; }
        public IEnumerable<TypeDefinition> interfaces { get; set; }
    }

    class Program
    {
        public static readonly TypeReferenceConverter referenceConverter = new TypeReferenceConverter();

        public static void writeNameAndLocationProperties(JsonWriter writer, TypeReference value, JsonSerializer serializer)
        {
            var location = new List<string>();
            var declaringType = value.DeclaringType;
            while (declaringType != null)
            {
                location.Add(declaringType.Name);
                if (declaringType.Namespace != "")
                    location.Add(declaringType.Namespace);
                declaringType = declaringType.DeclaringType;
            }
            if (value.Namespace != "")
                location.Add(value.Namespace);
            location.Reverse();

            writer.WritePropertyName("location");
            serializer.Serialize(writer, location);

            writer.WritePropertyName("name");
            writer.WriteValue(value.Name);
        }

        static void collectTypes(IEnumerable<TypeDefinition> types, ICollection<TypeDefinition> res)
        {
            foreach (var def in types)
            {
                res.Add(def);
                collectTypes(def.NestedTypes, res);
            }
        }

        static void Main(string[] args)
        {
            var allTypes = new List<TypeDefinition>();

            foreach (var arg in args) {
                var assembly = AssemblyDefinition.ReadAssembly(arg);
                collectTypes(assembly.MainModule.Types, allTypes);
            }

            var publicTypes = allTypes.Where(t => t.IsPublic || t.IsNestedPublic);

            var res = new GenXHelperOutput
            {
                enums = publicTypes.Where(t => t.IsEnum),
                classes = publicTypes.Where(t => !t.IsEnum && t.IsClass),
                interfaces = publicTypes.Where(t => t.IsInterface)
            };

            Console.WriteLine(JsonConvert.SerializeObject(res, Formatting.None, new JsonConverter[] {
                new CustomAttributeArgumentConverter(),
                new CustomAttributeConverter(),
                new MethodDefinitionConverter(),
                new FieldDefinitionConverter(),
                new PropertyDefinitionConverter(),
                new TypeDefinitionConverter(),                
                new InterfaceImplementationConverter(),
                new TypeReferenceConverter()
            }));
        }
    }
}
