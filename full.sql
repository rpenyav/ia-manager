-- MySQL dump 10.13  Distrib 8.4.8, for Linux (aarch64)
--
-- Host: host.docker.internal    Database: provider_manager
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.28-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_password_resets`
--

DROP TABLE IF EXISTS `admin_password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_password_resets` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `tokenHash` varchar(64) NOT NULL,
  `expiresAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `usedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_password_resets`
--

LOCK TABLES `admin_password_resets` WRITE;
/*!40000 ALTER TABLE `admin_password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(120) NOT NULL,
  `name` varchar(120) DEFAULT NULL,
  `email` varchar(160) DEFAULT NULL,
  `role` varchar(32) NOT NULL DEFAULT 'admin',
  `status` varchar(16) NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `passwordHash` varchar(255) DEFAULT NULL,
  `mustChangePassword` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES ('2305bd7e-3db3-4458-970c-4a7c010e6451','admin','Rafa','rafa@rafapenya.com','admin','active','2026-02-09 10:42:30','2026-02-09 10:43:18','b22a5bd17ccfe5903604e14a3870ff44247348528df9bf84d6424e5f71cc74cc',0),('706390f9-bd96-44cc-8122-17febed362bf','normal','Persona Normal','personanormal@persona.com','editor','active','2026-02-09 16:01:55','2026-02-09 16:14:55','b22a5bd17ccfe5903604e14a3870ff44247348528df9bf84d6424e5f71cc74cc',0);
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_keys`
--

DROP TABLE IF EXISTS `api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_keys` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) DEFAULT NULL,
  `name` varchar(120) NOT NULL,
  `hashedKey` varchar(255) NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_keys`
--

LOCK TABLES `api_keys` WRITE;
/*!40000 ALTER TABLE `api_keys` DISABLE KEYS */;
INSERT INTO `api_keys` VALUES ('3506b91b-1ff4-4aee-bc71-d6ff7a68e2a5','7ca039ce-0f90-4392-b91d-4a43af3a8722','horachanante','db8756d50a50b5b1d1b08588879b28639a67c6b2ddf52ed9ccbb1bdb5cdcbfa1','active','2026-02-08 19:39:57'),('4b430faf-358c-4eb0-a193-b7b377d9962e','41813700-3306-456e-8bb0-210239e7709e','teniente dan dan','e624345ac1d1e29a65f08dfe4f50297361d17a01e3bc9eb4bc363b1b18d1e3ea','active','2026-02-08 19:29:28'),('751eb828-dc57-411a-a051-98e84bd7ff2f',NULL,'cliente-acme','0588d9e0aa3117bc875d49ad1c43730801687e72520c11c2f9f7fc759c10658e','active','2026-02-08 18:21:11'),('76bb32df-46f8-4fee-a2ea-a17d35603024',NULL,'backoffice','ea10032e41868989ee5269c7f5dbff1de9a284b5204293ef2a7888c0837cd1ae','active','2026-02-08 12:28:46'),('7cd2a397-2eef-41a5-876c-0afbb32ab54f','8b9c0116-52ff-472a-8f4e-c8e3b7066c45','chaaa','ac3338a88c68c11e8b7d2bfe66f5b4e52bb65b263d72414a2f25c0bcead95185','active','2026-02-08 19:53:13'),('af308021-4135-482a-86ec-975531b803d2','1ed4bda3-1e79-41dd-9abb-025fb25cd760','teniente dan dan','f3c1e7e8951145682df763e9d2c7cddc3bec6e5acec19422c6de3f2b05d3105e','active','2026-02-08 19:32:54');
/*!40000 ALTER TABLE `api_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_events`
--

DROP TABLE IF EXISTS `audit_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_events` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `action` varchar(64) NOT NULL,
  `status` varchar(32) NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_events`
--

LOCK TABLES `audit_events` WRITE;
/*!40000 ALTER TABLE `audit_events` DISABLE KEYS */;
INSERT INTO `audit_events` VALUES ('4952dba4-31e8-46fd-a233-87893c5a4aba','41813700-3306-456e-8bb0-210239e7709e','runtime.execute','rejected','{\"reason\":\"Tenant is disabled\"}','2026-02-08 21:29:46'),('6d2909c5-f196-4be5-8404-9345bf905781','100817db-5642-4173-b7aa-07751bbb0a45','seed.demo','accepted','{\"seeded\":true}','2026-02-08 13:39:59'),('77b4092d-0d81-4a9e-b478-2a4b5a6f77bb','1ed4bda3-1e79-41dd-9abb-025fb25cd760','runtime.execute','rejected','{\"reason\":\"Tenant is disabled\"}','2026-02-08 19:33:00'),('9855ef63-5a78-493e-96fe-5334a714aa63','8b9c0116-52ff-472a-8f4e-c8e3b7066c45','runtime.execute','accepted','{\"providerId\":\"ce188c7b-e779-4dfa-9b5c-9b399b090e12\",\"model\":\"gpt-4o-mini\"}','2026-02-08 19:53:24'),('9e356101-857d-489c-bf0d-72b332166033','8b9c0116-52ff-472a-8f4e-c8e3b7066c45','runtime.execute','accepted','{\"providerId\":\"ce188c7b-e779-4dfa-9b5c-9b399b090e12\",\"model\":\"gpt-4o-mini\"}','2026-02-08 21:08:33'),('a460a58c-4080-4a8d-b9a4-f80e3ded1f8e','7ca039ce-0f90-4392-b91d-4a43af3a8722','runtime.execute','rejected','{\"reason\":\"Invalid credentials format, must be JSON\"}','2026-02-08 19:42:23'),('c1933f5c-1ba6-4545-8bef-0619cd9612ec','41813700-3306-456e-8bb0-210239e7709e','runtime.execute','rejected','{\"reason\":\"Tenant is disabled\"}','2026-02-08 21:32:41'),('e32a4a98-cccb-44e4-9d14-b5654d2374d6','7ca039ce-0f90-4392-b91d-4a43af3a8722','runtime.execute','rejected','{\"reason\":\"Invalid credentials format, must be JSON\"}','2026-02-08 19:40:05');
/*!40000 ALTER TABLE `audit_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_conversations`
--

DROP TABLE IF EXISTS `chat_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_conversations` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `providerId` varchar(36) NOT NULL,
  `model` varchar(128) NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `apiKeyId` varchar(36) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_conversations`
--

LOCK TABLES `chat_conversations` WRITE;
/*!40000 ALTER TABLE `chat_conversations` DISABLE KEYS */;
INSERT INTO `chat_conversations` VALUES ('251be441-6153-4a76-ae68-e6ee5d9f359d','41813700-3306-456e-8bb0-210239e7709e','51fc3eed-350b-415a-91bf-4aeac584e1ce','1f374c8e-0f8d-4a47-ba39-93c5d27538e2','gpt-4o-mini','hola. soy Jasper','4b430faf-358c-4eb0-a193-b7b377d9962e','2026-02-08 21:29:46','2026-02-08 21:29:46');
/*!40000 ALTER TABLE `chat_conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` varchar(36) NOT NULL,
  `conversationId` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `role` varchar(16) NOT NULL,
  `content` text NOT NULL,
  `tokensIn` int(11) NOT NULL DEFAULT 0,
  `tokensOut` int(11) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES ('2751f1a2-83ed-4ca7-a966-ee8f85c0d68e','251be441-6153-4a76-ae68-e6ee5d9f359d','41813700-3306-456e-8bb0-210239e7709e','51fc3eed-350b-415a-91bf-4aeac584e1ce','user','tr45t45y',0,0,'2026-02-08 21:32:41'),('5371c340-9bb9-4ad6-b636-e33ffbd31dbd','251be441-6153-4a76-ae68-e6ee5d9f359d','41813700-3306-456e-8bb0-210239e7709e','51fc3eed-350b-415a-91bf-4aeac584e1ce','user','hola. soy Jasper',0,0,'2026-02-08 21:29:46');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_users`
--

DROP TABLE IF EXISTS `chat_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_users` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `email` varchar(160) NOT NULL,
  `name` varchar(120) DEFAULT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_users`
--

LOCK TABLES `chat_users` WRITE;
/*!40000 ALTER TABLE `chat_users` DISABLE KEYS */;
INSERT INTO `chat_users` VALUES ('51fc3eed-350b-415a-91bf-4aeac584e1ce','41813700-3306-456e-8bb0-210239e7709e','jasper@jasper.com','Jasper','51af81c7a5e3a7147c17b367fb8c36187f76b5789287802b242e8166de379860','disabled','2026-02-08 21:29:31','2026-02-09 12:08:04');
/*!40000 ALTER TABLE `chat_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `db_connections`
--

DROP TABLE IF EXISTS `db_connections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `db_connections` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `engine` varchar(32) NOT NULL DEFAULT 'mysql',
  `encryptedConfig` text NOT NULL,
  `allowedTables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`allowedTables`)),
  `readOnly` tinyint(1) NOT NULL DEFAULT 1,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `db_connections`
--

LOCK TABLES `db_connections` WRITE;
/*!40000 ALTER TABLE `db_connections` DISABLE KEYS */;
/*!40000 ALTER TABLE `db_connections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documentation_entries`
--

DROP TABLE IF EXISTS `documentation_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documentation_entries` (
  `id` varchar(36) NOT NULL,
  `menuSlug` varchar(64) NOT NULL,
  `category` varchar(64) NOT NULL DEFAULT 'general',
  `title` varchar(160) NOT NULL,
  `content` text NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `orderIndex` int(11) NOT NULL DEFAULT 0,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documentation_entries`
--

LOCK TABLES `documentation_entries` WRITE;
/*!40000 ALTER TABLE `documentation_entries` DISABLE KEYS */;
INSERT INTO `documentation_entries` VALUES ('0602f9ec-7794-4250-a368-e0d1816c979d','documentation','search','Busqueda textual','El parametro q busca por titulo o contenido. Se usa en el input global y en la pagina de docs. Combinar con menuSlug y category para filtrar.',NULL,2,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('0754a8ba-e941-4951-9960-12c4048a9923','policies','concepts','Politicas de consumo','Las politicas definen limites por tenant: requests por minuto, tokens diarios, coste diario y redaccion. Se aplican antes de cada ejecucion runtime. Sin politica valida no se permite ejecutar.',NULL,1,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('0c7e5141-4614-455c-aa0e-45fbe82f528b','settings','operations','Configuracion por entorno','Mantener valores de entorno separados para dev y prod. Revisa CACHE_REDIS_ENABLED y QUEUE_REDIS_ENABLED si no hay Redis.',NULL,4,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('15d2171b-16d4-4a8f-bbc8-c207056a0bba','providers','security','Credenciales cifradas','Las credenciales se cifran en reposo mediante AES-GCM. Solo se descifran en memoria cuando el adapter ejecuta la llamada. No se exponen en ninguna respuesta del API.',NULL,2,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('16891323-df83-4dd9-b221-12c24c9a33f3','audit','traza','Auditoría','Registro de eventos sin almacenar prompts completos.',NULL,1,1,'2026-02-08 16:36:37','2026-02-08 16:36:37'),('1f79c4e8-54e6-4487-a0c4-bf07d48efbaf','pricing','impact','Impacto en limites','El coste calculado influye en maxCostPerDayUsd. Precios incorrectos pueden bloquear uso o permitir gastos excesivos. Revisa periodicamente.',NULL,4,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('22061ce4-c7da-427c-9464-3187451f9980','documentation','concepts','Modelo de documentacion','Cada entrada se asocia a menuSlug y category. El panel lateral muestra entradas por seccion. orderIndex permite controlar el orden visible.',NULL,1,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('26352f0f-073f-484d-89b2-29b99fd7855a','runtime','performance','Latencia y concurrencia','La latencia depende del proveedor externo. Usa colas si deseas aislar cargas y reintentos. Configura timeouts y observa el throughput en Observability.',NULL,4,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('27b080ee-4f9a-4612-9394-b1bca1c3f174','notifications','email','Email','Configura SMTP en variables de entorno y define recipients en el canal. El contenido del email incluye severidad, limites y consumo actual.',NULL,2,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('28d7874e-d3c1-4aa9-be7a-21e4f1c73912','settings','scheduler','Cron de alertas','ALERTS_CRON define cada cuanto se evalua el consumo. ALERTS_MIN_INTERVAL_MINUTES evita reenvios constantes. Ajusta segun volumen.',NULL,3,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('2c7a88e9-7c6a-4d89-adcd-008d63ff831e','pricing','operations','Mantenimiento de tarifas','Actualiza tarifas cuando cambien los precios del proveedor. Deshabilita entradas obsoletas para evitar costeo incorrecto. Usa la UI o el endpoint /pricing.',NULL,3,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('33c88e3b-c397-4272-979b-2cce110795e0','webhooks','security','Firmas y autenticidad','Si defines un secreto, el payload se firma con HMAC SHA256. El receptor puede validar la firma para asegurar integridad y autenticidad.',NULL,2,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('3456de5c-e5c7-404f-a6ff-4fa37441a348','tenants','troubleshooting','Diagnostico rapido','Si un tenant no puede ejecutar runtime, verifica que exista politica activa, que el kill switch esté desactivado y que tenga al menos un provider habilitado.',NULL,6,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('3fc31f70-a2da-4c34-a4d1-6b36cda42102','notifications','alertas','Canales de notificación','Configura email o Slack para alertas de consumo.',NULL,1,1,'2026-02-08 16:36:37','2026-02-08 16:36:37'),('409cecab-902d-4e90-9edf-d467bbdb37da','usage','alertas','Monitoreo de uso','Consulta consumo y dispara alertas según políticas.',NULL,1,1,'2026-02-08 16:36:37','2026-02-08 16:36:37'),('452e0f62-b4e0-44d5-81d4-554227c4945f','observability','concepts','Observabilidad','La observabilidad permite medir latencia, errores y throughput. Es clave para dimensionar proveedores y detectar degradacion.',NULL,1,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('46df6032-06a4-4802-bb74-a72c5d82e4cd','tenants','concepts','Que es un tenant','Un tenant es una unidad logica que representa a un cliente o dominio de negocio. Cada tenant tiene proveedores, politicas y consumo aislados. Todas las operaciones runtime deben estar asociadas a un tenant valido.',NULL,1,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('4e6b00d9-2b6a-4890-98c8-aa66db632efd','settings','kill','Kill switch global','Bloquea todas las ejecuciones runtime para todos los tenants. Usar solo en incidentes graves. Revertir cuando la causa este mitigada.',NULL,2,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('54cb5788-1eb2-4277-a5fc-b6876747746f','policies','limits','Rate limiting','maxRequestsPerMinute controla el numero de llamadas por minuto. Puede usar Redis o memoria. Exceder el limite retorna 429 y no se factura.',NULL,2,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('550a569c-10f8-466b-b0a3-76185a700cfc','webhooks','events','Tipos de eventos','El evento base es audit.event. Puedes ampliar con otros eventos si agregas nuevos modulos. Usa el campo events para filtrar por tipo o * para todos.',NULL,4,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('55eb73cd-cc2c-48e1-9d76-7a4e76bad50d','notifications','operations','Buenas practicas','Define canales globales para equipo central y canales por tenant para equipos dedicados. Ajusta el cron para evitar ruido innecesario.',NULL,4,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('5e67f051-3aca-4f98-afbd-2adb46f5c840','policies','limits','Tokens y coste diario','maxTokensPerDay y maxCostPerDayUsd se calculan con usage_events y pricing_models. Si se supera, la ejecucion se bloquea. Es clave para control financiero.',NULL,3,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('5e73dc62-dd54-475d-8b8e-eb0ac66ebc7d','runtime','errors','Errores y respuestas','Errores de autenticacion retornan 401. Limites superados retornan 429 o 403 segun el caso. Fallos de proveedor retornan 502 con mensaje resumido. No se devuelven credenciales ni payloads sensibles.',NULL,3,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('5f1cf793-44b9-4fe6-bf54-9acda5d3fcc9','audit','integration','Exportacion de eventos','Los eventos pueden enviarse a webhooks y SQS. Esto habilita integracion con SIEM, data lake o pipelines de cumplimiento. El envio no bloquea el flujo principal.',NULL,3,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('65959567-1231-468f-8da7-fb2ec70cab70','policies','data','Redaccion de datos','Cuando redactionEnabled esta activo, se aplica el modulo de redaccion antes de llamar al proveedor. Esto reduce la exposicion de datos sensibles en prompts.',NULL,4,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('6766741f-3160-4748-99de-1f4dc7f7b6e1','runtime','concepts','Endpoint unico de ejecucion','El endpoint /runtime/execute es la unica puerta de acceso a IA. Centraliza autenticacion, politicas, redaccion, costeo y auditoria. Otros modulos deben consumir solo este endpoint.',NULL,1,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('6acbc400-f5bd-455b-aef4-d9731bbbce08','documentation','gestión','Documentación interna','Crea y organiza entradas por menú, categoría y orden.',NULL,1,1,'2026-02-08 16:36:37','2026-02-08 16:36:37'),('6adc15c3-d8da-4531-8814-0640f60b9188','settings','concepts','Ajustes globales','Settings controla funciones globales: kill switch, cron de alertas y parametros operativos. Son cambios de alto impacto y deben auditarse.',NULL,1,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('7dea657e-380c-4379-9635-e6df02ffa33b','webhooks','export','Webhooks','Envía eventos a tus sistemas para auditoría externa.',NULL,1,1,'2026-02-08 16:36:37','2026-02-08 16:36:37'),('80de6326-607a-46c1-89bd-ba4df53d598e','runtime','workflow','Orden de validaciones','El flujo recomendado es: autenticar, validar kill switch global y por tenant, aplicar rate limit, validar limites de tokens y coste, redaccion, llamada al adapter, registrar audit y usage. Si alguna validacion falla, se corta la ejecucion.',NULL,2,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('83677bfc-810e-49dd-a921-204734ba0844','providers','adapters','Adapters soportados','Se incluyen adapters para openai, azure-openai, aws-bedrock, vertex-ai y mock. Cada adapter normaliza la llamada a un contrato comun. Esto permite cambiar de proveedor sin modificar el resto del sistema.',NULL,3,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('90c05e7e-cc00-4e6e-ab9e-b9401a86d718','tenants','gestión','Crear y operar tenants','Cada tenant representa un cliente con políticas y límites propios.',NULL,1,1,'2026-02-08 16:36:37','2026-02-08 16:36:37'),('94ba10ba-ca65-4ef5-bb36-3afe66493d97','tenants','workflow','Ciclo de vida del tenant','Crea el tenant, define la politica base, registra proveedores y valida el runtime. Ajusta limites a medida que el uso crece. Ante incidentes, activa el kill switch y revisa auditoria.',NULL,2,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('9530b72a-9f67-4feb-826b-c71a50a26b1a','documentation','workflow','Gestion operativa','Actualiza la documentacion al cambiar politicas, proveedores o procesos. Usa la UI de Docs para mantener contenido vivo y consistente.',NULL,4,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('9a049167-57c0-4ae5-a1bd-fc69f20f13f9','usage','alerts','Alertas automaticas','El scheduler evalua consumo segun cron y genera alertas si se exceden limites. Los canales habilitados reciben notificaciones. Ajusta cron y minIntervalMinutes para evitar spam.',NULL,2,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('9a1b6aa8-8fb7-4592-9d73-87d807b83ef5','usage','concepts','Eventos de uso','Cada ejecucion genera un usage_event con tokens de entrada y salida, modelo y coste. Esta tabla es la base para resumenes, limites y alertas.',NULL,1,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('9d37ca82-be04-4cf8-b305-26765a3842ae','providers','troubleshooting','Errores comunes','Revisa credenciales, region y limites del proveedor. Errores 401 suelen indicar credenciales invalidas; errores 429 indican limite del proveedor. Usa Audit para rastrear el origen.',NULL,4,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('9e9f688a-30f4-4510-943e-7e65e9fb87bc','documentation','api','Endpoints disponibles','GET /docs, GET /docs/:id, POST /docs, PATCH /docs/:id, DELETE /docs/:id. Todos requieren autenticacion por API key o JWT.',NULL,3,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('a247c63e-b3e5-4cd7-a853-24f63a09c02e','webhooks','delivery','Entrega y reintentos','Con colas habilitadas, el envio se gestiona en background. Sin colas, el envio es directo y cualquier fallo se registra como error. La app principal no se bloquea.',NULL,3,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('a6a239a0-6035-40d7-a9f8-7ddbc522fc5d','providers','concepts','Registro de proveedores','Los providers representan conexiones con LLMs externos. Cada provider tiene tipo, displayName, credenciales cifradas y configuracion adicional. El runtime usa providerId para decidir a quien llamar.',NULL,1,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('a80bcb4d-3c54-44be-9de2-1f0c103e4d9e','pricing','concepts','Pricing por modelo','Cada entrada define coste por 1k tokens de entrada y salida para un modelo. El providerType normaliza variantes como azure-openai o aws-bedrock.',NULL,1,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('aa6fdbce-69d1-421b-861d-b9ca3b92a44a','audit','concepts','Audit trail','audit_events registra acciones clave con estado y metadatos. Es el registro principal de cumplimiento y seguridad. Permite trazar cada llamada sin almacenar prompts completos.',NULL,1,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('ad40a9bf-e3c3-4422-ab07-d692023500f8','pricing','resolution','Resolucion de precios','El runtime busca primero coincidencia exacta por modelo. Si no existe, usa la entrada comodin con model = *. Esto evita fallos cuando el proveedor retorna modelos nuevos.',NULL,2,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('b0143ccb-d125-4ac0-a5a8-1e0f16e32b26','notifications','slack','Slack','Configura webhookUrl en el canal. El mensaje incluye tenant, tipo de alerta y valores que superaron el limite.',NULL,3,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('b1137492-21d8-4822-9b16-e6760b3b4f4c','webhooks','concepts','Webhooks de auditoria','Los webhooks envian eventos a sistemas externos. Puedes filtrar por tipo de evento y por tenant. Son utiles para integraciones con plataformas internas.',NULL,1,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('b44c8e9f-85d2-41f3-917a-4657a4985277','overview','workflow','Flujo de trabajo recomendado','Revisa el overview al inicio de cada jornada. Si hay alertas, entra a Usage para detalle y a Audit para trazas. Si detectas riesgo, valida politicas, proveedores y kill switch.',NULL,3,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('bf0d6af1-9a9d-4da8-82a1-b100c5886db7','notifications','concepts','Canales de alertas','Los canales definen destinos para alertas automaticas. Pueden ser globales o por tenant. Se habilitan o deshabilitan sin borrar configuracion.',NULL,1,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('bf743da7-d23c-4158-8c82-796d50859410','tenants','operaciones','Buenas practicas de administracion','Mantén nombres claros, registra un owner y revisa periodicamente politicas y proveedores asociados. Evita crear tenants duplicados por cliente.',NULL,5,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('c15dffe5-e2ec-4530-82f2-cbc43275aaf6','overview','intro','Qué muestra el overview','Resumen rápido de consumo, alertas y proveedores activos.',NULL,1,1,'2026-02-08 16:36:37','2026-02-08 16:36:37'),('c664a642-d9d7-4956-aa17-c49eace1dd76','tenants','data','Datos almacenados','Se guarda solo metadata del tenant: nombre, estado y banderas de control. No se almacenan prompts ni respuestas completas. El objetivo es minimizar datos sensibles.',NULL,4,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('cc58a316-e113-4cd6-8b09-01279d2453c9','usage','summary','Resumen diario','El resumen agrega tokens y coste por tenant en el dia actual. Se calcula en tiempo real, no se guarda duplicado. Es util para dashboards y reportes operativos.',NULL,3,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('d7e89a66-4959-41fe-9e04-f1e28f063f3c','observability','metrics','Metricas recomendadas','Latencia de runtime, errores por proveedor, coste diario por tenant, tasa de redaccion, profundidad de colas y fallos de webhooks.',NULL,2,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('da476dda-8666-4677-ab07-874431edc1c1','observability','traces','Trazas distribuidas','Integra OpenTelemetry para trazas de llamadas a proveedores. Esto ayuda a identificar cuellos de botella y fallos intermitentes.',NULL,4,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('e0c75e6a-f471-46d8-9e41-e56bcbabf1fe','usage','workflow','Investigacion de gastos','Si hay incremento anormal, revisa Pricing para confirmar tarifas. Luego revisa Providers y Audit para identificar origen. Considera activar kill switch temporal.',NULL,4,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('e3855d6d-f23c-4303-8816-d606d5aaaab6','overview','limits','Limitaciones de la vista','El overview no muestra prompts ni respuestas, solo metadatos. No es una consola de configuracion; para ajustes usa Tenants, Policies y Settings. La informacion es agregada, no reemplaza auditoria detallada.',NULL,4,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('e538dcda-f30f-4497-bbea-efb55c6880f6','audit','privacy','Privacidad y retencion','No se guardan prompts ni respuestas completas. Define politicas de retencion si exportas eventos fuera del sistema. Esto facilita compliance con normativas.',NULL,4,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('e5cdf37a-6d4e-4fcf-a29f-26ab85abdffb','tenants','security','Kill switch por tenant','El kill switch del tenant bloquea todas las ejecuciones para ese tenant sin afectar a otros. Es la medida de contencion recomendada frente a abuso o coste inesperado. Se puede reactivar cuando el riesgo pase.',NULL,3,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('eab731b4-43f1-462b-bf2e-d0c74177b6e2','runtime','ejecución','Endpoint único','Todas las llamadas pasan por /runtime/execute con garantías aplicadas.',NULL,1,1,'2026-02-08 16:36:37','2026-02-08 16:36:37'),('ebbe8f66-e62b-4faf-8cf1-13954a8d813f','overview','data','Fuentes de informacion','Los datos del overview provienen de usage_events, audit_events y pricing_models. El consumo se calcula por dia y se asocia al tenant activo. Las alertas dependen de los limites de politicas y del scheduler.',NULL,2,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('f41544c5-12e7-4efc-95b8-34dba54c6caa','observability','logs','Logs','Los logs deben incluir correlationId, tenantId y providerId. Evita registrar prompts completos. Usa niveles de log y agrega a un sistema central.',NULL,3,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('fc6e798f-e010-405d-8178-2fdb4d33921f','audit','data','Metadatos auditables','Incluye tenantId, accion, estado y metadata contextual. Se recomienda no incluir contenido sensible en metadata. Usa identificadores y referencias en lugar de payloads completos.',NULL,2,1,'2026-02-08 16:36:15','2026-02-08 16:36:15'),('fc843ade-a35d-4a7b-ab4a-8495f13b8487','overview','concepts','Proposito del overview','El overview es la vista de control rapido para operaciones. Reune indicadores de uso, alertas y actividad reciente sin ejecutar acciones. Su objetivo es permitir decisiones rapidas sobre limites, proveedores y seguridad.',NULL,1,1,'2026-02-08 16:36:15','2026-02-08 16:36:15');
/*!40000 ALTER TABLE `documentation_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,260207000000,'InitSchema20260207000000'),(2,260208000100,'AddTenantServices20260208000100'),(3,260208000200,'AddTenantPricings20260208000200'),(4,260208000300,'AddChatTables20260208000300'),(5,260208000400,'AddAdminUsers20260208000400'),(6,260208000500,'AddAdminUserPassword20260208000500'),(7,260208000600,'AddAdminUserMustChange20260208000600'),(8,260208000700,'AddAdminPasswordResets20260208000700'),(9,260209000100,'AddSubscriptions20260209000100'),(10,260209000200,'AddSubscriptionHistory20260209000200'),(11,260209000300,'AddBillingEmailAndPaymentRequests20260209000300'),(12,260209000400,'AddTenantProfileFields20260209000400'),(13,260209000500,'AddTenantPortalAuth20260209000500'),(14,260209001100,'AddSubscriptionPendingRemoval20260209001100');
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_channels`
--

DROP TABLE IF EXISTS `notification_channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_channels` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) DEFAULT NULL,
  `type` varchar(16) NOT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `encryptedSecret` text DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_channels`
--

LOCK TABLES `notification_channels` WRITE;
/*!40000 ALTER TABLE `notification_channels` DISABLE KEYS */;
INSERT INTO `notification_channels` VALUES ('4d8d5808-6004-49d2-b7d3-587fe3715538','100817db-5642-4173-b7aa-07751bbb0a45','email','{\"name\":\"Ops Demo\",\"recipients\":[\"ops@example.com\"]}',NULL,0,'2026-02-08 13:39:59','2026-02-08 13:39:59');
/*!40000 ALTER TABLE `notification_channels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ocr_documents`
--

DROP TABLE IF EXISTS `ocr_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ocr_documents` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `title` varchar(160) NOT NULL,
  `source` varchar(255) DEFAULT NULL,
  `encryptedContent` text NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ocr_documents`
--

LOCK TABLES `ocr_documents` WRITE;
/*!40000 ALTER TABLE `ocr_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `ocr_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `policies`
--

DROP TABLE IF EXISTS `policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `policies` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `maxRequestsPerMinute` int(11) NOT NULL DEFAULT 60,
  `maxTokensPerDay` int(11) NOT NULL DEFAULT 200000,
  `maxCostPerDayUsd` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `redactionEnabled` tinyint(1) NOT NULL DEFAULT 1,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`metadata`)),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `policies`
--

LOCK TABLES `policies` WRITE;
/*!40000 ALTER TABLE `policies` DISABLE KEYS */;
INSERT INTO `policies` VALUES ('0baeaa9e-ab99-46c7-b2cf-48472defa713','41813700-3306-456e-8bb0-210239e7709e',60,200000,0.0000,1,'{}','2026-02-08 19:28:13','2026-02-08 19:28:13'),('73aae51d-6690-4a71-ad33-435a3178a7f5','096318e9-a284-4271-99f4-52353188126e',120,200000,50.0000,1,'{\"seeded\":true}','2026-02-08 17:57:51','2026-02-08 17:57:51'),('78de7118-15be-4f8d-80ec-c3183854d125','1ed4bda3-1e79-41dd-9abb-025fb25cd760',60,200000,0.0000,1,'{}','2026-02-08 19:32:49','2026-02-08 19:32:49'),('c0cc531c-5ab6-433e-9084-f205783b4e15','100817db-5642-4173-b7aa-07751bbb0a45',120,200000,50.0000,1,'{\"seeded\":true}','2026-02-08 13:39:59','2026-02-08 13:39:59'),('d23931d4-9639-41a0-ad17-607d7e0d21ef','7ca039ce-0f90-4392-b91d-4a43af3a8722',60,200000,0.0000,1,'{}','2026-02-08 19:39:08','2026-02-08 19:39:08'),('f289238b-a242-48a1-ab24-08d2c43f9e76','8b9c0116-52ff-472a-8f4e-c8e3b7066c45',60,200000,0.0000,1,'{}','2026-02-08 19:52:13','2026-02-08 19:52:13');
/*!40000 ALTER TABLE `policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pricing_models`
--

DROP TABLE IF EXISTS `pricing_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pricing_models` (
  `id` varchar(36) NOT NULL,
  `providerType` varchar(64) NOT NULL,
  `model` varchar(128) NOT NULL,
  `inputCostPer1k` decimal(10,6) NOT NULL,
  `outputCostPer1k` decimal(10,6) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pricing_models`
--

LOCK TABLES `pricing_models` WRITE;
/*!40000 ALTER TABLE `pricing_models` DISABLE KEYS */;
INSERT INTO `pricing_models` VALUES ('3590734f-970c-47c9-9a09-e86b587c2d72','openai','gpt-4o-mini',0.000150,0.000600,1,'2026-02-08 18:02:43','2026-02-09 23:09:55'),('3d1a55bb-ba78-427c-b2db-b0fc49ce41fc','openai','gpt-4o-mini',1.000000,2.000000,1,'2026-02-08 19:53:03','2026-02-08 19:53:03'),('3ef0ea86-f790-4133-9e42-ecfc8711f36b','openai','gpt-4o-mini',1.000000,2.000000,1,'2026-02-08 19:39:46','2026-02-08 19:39:46'),('57cea938-bef5-43c7-8851-34d4e1ed9819','openai','gpt-4o-mini',1.000000,2.000000,1,'2026-02-08 19:32:52','2026-02-08 19:32:52'),('5917a6e8-1ebb-47ac-a3b7-9ff23452a285','openai','gpt-4o-mini',0.000150,0.000600,1,'2026-02-08 12:28:45','2026-02-08 17:52:48'),('670322fc-0d38-4244-9c8f-431a60d37753','openai','gpt-4.1-mini',0.000400,0.001600,1,'2026-02-08 12:28:45','2026-02-09 23:09:55'),('69858f3b-3e4c-4243-9720-e9b4c118fc94','vertex-ai','gemini-2.0-flash-lite',0.000075,0.000300,1,'2026-02-08 12:28:45','2026-02-09 23:09:55'),('b44791bf-db49-4676-a274-221349b4495b','aws-bedrock','claude-3.5-sonnet',0.006000,0.003000,1,'2026-02-08 12:28:45','2026-02-09 23:09:55'),('c275120c-d66e-446e-9f77-32b9a081c221','openai','gpt-4o-mini',1.000000,2.000000,1,'2026-02-08 19:28:49','2026-02-08 19:28:49'),('e5e248ea-35e7-4332-bfa4-b69308f7cb9e','vertex-ai','gemini-2.0-flash',0.000150,0.000600,1,'2026-02-08 12:28:45','2026-02-09 23:09:55');
/*!40000 ALTER TABLE `pricing_models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `providers`
--

DROP TABLE IF EXISTS `providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `providers` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `type` varchar(64) NOT NULL,
  `displayName` varchar(255) NOT NULL,
  `encryptedCredentials` text NOT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `providers`
--

LOCK TABLES `providers` WRITE;
/*!40000 ALTER TABLE `providers` DISABLE KEYS */;
INSERT INTO `providers` VALUES ('1f374c8e-0f8d-4a47-ba39-93c5d27538e2','41813700-3306-456e-8bb0-210239e7709e','openai','Teniente Display Dan','p9eYrrSa/3T0HnLsvJ62Yta9w/yyASMLOBHWJYUXVwmPh0vCLx+TSh72yZn677+ocjslkzYnQI0OHS44Grjw3/ZbD4T7p0T9QMFLkG8aujVlRd79bv/CHPkYA6eHKdSnG/Q5mSlXbwHhfLU2+L/rCCb/XcsRZMmmJCFUhCC2wWdLh9MXxZB9nkeP8hKYtO/XJlYH8eV6pccdEBvp8DF4O5kQVg3/nM2YCn0Aa9Y1ktMAdVROKlKVShJObKs4N/aD3/rl93/oA3SV4qUyb7zYDxCq5jhNiq2Cm/cihaek1B80Lsf+d/FjLxZ/o/sQEGZL','{}',1,'2026-02-08 19:26:59','2026-02-08 19:26:59'),('32d00ae2-400b-4eee-a732-94f29a7c3a3d','1ed4bda3-1e79-41dd-9abb-025fb25cd760','openai','Teniente Display Dan','7OECe446wAITL1JQFafvnGn5mLIxDunZjERTLZRI2ajgF3+cNDu3SURKWK04i11ebRe6gQwyUDkeNE7rsbFzX8ZogsDFArcOpSvnXZ5uvCh/+VCAgciLS8yNZEZXp/VC24ysZQPdfpkA13QDQyLI2TGSaXnfZ3SOn60CB6Zdpp4ZtCw7JD93J3SrVgDK0P2E4VrgkTO1BFvFiH/gSZbX2T2n6k5KvjsNSPJ5Xl3w81YrTZnkiSwpdrl+izSw6tIWSw4NB2HHGbVCeQHgSPPcEemS0aYj4Bu3lcM2Wuy27o5tnWrhPu9Ze94BOge5tani','{}',1,'2026-02-08 19:32:46','2026-02-08 19:32:46'),('584f8776-6c71-49fa-bb6e-38699a1ac326','100817db-5642-4173-b7aa-07751bbb0a45','mock','Mock Provider','4jRWZPjLagKW91Efw+0EkqVvxAd5wS9yP0UaNmKk3tqb0v58bXnlVdyArQ==','{}',1,'2026-02-08 13:39:59','2026-02-08 13:39:59'),('97a878be-44ff-4276-8100-0c7c8b8ace04','7ca039ce-0f90-4392-b91d-4a43af3a8722','openai','la hora chanante','ieQ4FI0fuXn4Pq5fJoxE1iGHNvEmvl+tra4y29sJCZAgffnli92SOHmMNYBm7hjJTkb1VUcqAQh+oEvQwNqCSuWXLrjOa3xjMPEyT6a8e+Fs1FpPu4yh5Yd3xDurT1oj03k+1h+ToyhqyXA1cF2g/L7C8x0D8wCkfoK6uoSzo6X8Nw54K0+Xv3/7TFvl6mwTkP7uMxuwuk++SGMsPncmalT10OYmseF5u0zpYZ2HKgQE2VSxeJJeQYAXVZgc7L49bVeAtEJJ1aKPy/d8htrwzcn9trUBGwg5ytymfNLLn8+q1gVMjZROUFpiaFGRaJKTzD0=','{}',1,'2026-02-08 19:42:19','2026-02-08 19:42:19'),('9d67b0a1-c23f-4e31-9d8f-e5cbc0721caf','096318e9-a284-4271-99f4-52353188126e','openai','OpenAI Cliente X','yjx2JGpa7Hrk+9kQXCzOo9B1+e5E4XFr25ftlCkCcZhq+ZwISzmKHjfMm0U3uYcKSrf8Yx41nohusp7xtR9Fc/shpJ6Btf/WpoMiwluWigsSeKDrklXY7fjWOHylEsG6cHsEL2WdA+j2AxGY9TAd6QXz1flyeCWwKK4/jaZHefEhITsFUpfQnjvqhYrhIhTgQ3ya7R4y7f/t0JbNt8SwAivilV0MNGc93MgbkINfbwZrk49gBG8SPxFsMebSYQnceNZygYuglVEkFAg83xNHPfg=','{}',1,'2026-02-08 18:00:05','2026-02-08 18:00:05'),('c3ac79d3-546d-4578-b46a-ef596755a3b2','7ca039ce-0f90-4392-b91d-4a43af3a8722','openai','la hora chanante','Kiklt2Jo7J2fvYBDmIueq59TUvabSNZ5AWK3i8m9HzM43ETUKMknl1400Ox8UdSXyrlBtySVXx6UG/ZP6UcF5dQmK01Munkz8csQtzZ90f1jYKMj6IhYWjdJTNmv4m8DFUdgFt6RVprQcGBbRZQLb6ZXmCfWbGdh7FaOaDTpdAq0KtOfeF2N/jvKWucU+ROzmtoQyqwoKZqNagjnKZZua+SNxfyHJoxThvO7Ubd0uF5y7qProR4D1g4u9cAB6bRFF9+qH4BqyJkr804zNg0uMvcN6sQ/cr3Vv5McwAA8VkJG5cQ+Xmg86SUBWgXIhcgfyA==','{}',1,'2026-02-08 19:38:54','2026-02-08 19:38:54'),('ce188c7b-e779-4dfa-9b5c-9b399b090e12','8b9c0116-52ff-472a-8f4e-c8e3b7066c45','openai','ch','wJw9K86IziUC2/CjVlHv1VVa6QKJqJh4RSqguZxmf4wE8C0YVu6ltAG66b9ih+Eb4QhdUBGb3vvQETTNvwpPbDg66PjpxhLGUsCWWH5umuGdD5LFvoReh5yIG5tjaYIuhVtEzcAZR9e73+OJwtezPUVQBW+KY5K2ggM7fRh03b2iGBYG9f4Mn25Zh3UuFBsOlry/Gclh3SC0ZIsFHRklYHxMJWRqU1S15R5s/L2v+GADh28T6QiaguiUJmL09rssQ0SRjIslYC5RXQzRhKX6JhMA0I1axp1rmatCyAx09og9UACMWUJ2zLVl4w+abho8DHEucugDV0jywVQYTGP81n1QQxLaOM6/fK1pDQ/6W9DndJtw','{}',1,'2026-02-08 19:52:06','2026-02-08 19:52:06');
/*!40000 ALTER TABLE `providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_catalog`
--

DROP TABLE IF EXISTS `service_catalog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_catalog` (
  `id` varchar(36) NOT NULL,
  `code` varchar(64) NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` text NOT NULL,
  `priceMonthlyEur` decimal(10,2) NOT NULL,
  `priceAnnualEur` decimal(10,2) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_service_catalog_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_catalog`
--

LOCK TABLES `service_catalog` WRITE;
/*!40000 ALTER TABLE `service_catalog` DISABLE KEYS */;
INSERT INTO `service_catalog` VALUES ('f1eb0142-05be-11f1-9145-5a0d05a37ed3','chat_generic','Chatbot genérico','Servicio conversacional general para FAQ y soporte.',49.00,499.00,1,'2026-02-09 13:55:08','2026-02-09 13:55:08'),('f1eb1bbe-05be-11f1-9145-5a0d05a37ed3','chat_ocr','Chatbot OCR','Servicio con OCR y consulta sobre documentos.',79.00,799.00,1,'2026-02-09 13:55:08','2026-02-09 13:55:08'),('f1eb1c18-05be-11f1-9145-5a0d05a37ed3','chat_sql','Chatbot SQL','Servicio para consultas sobre bases de datos.',99.00,999.00,1,'2026-02-09 13:55:08','2026-02-09 13:55:08');
/*!40000 ALTER TABLE `service_catalog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_history`
--

DROP TABLE IF EXISTS `subscription_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_history` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `subscriptionId` varchar(36) DEFAULT NULL,
  `period` varchar(16) NOT NULL,
  `basePriceEur` decimal(10,2) NOT NULL,
  `servicesPriceEur` decimal(10,2) NOT NULL,
  `totalBilledEur` decimal(10,2) NOT NULL,
  `startedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `endedAt` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_history`
--

LOCK TABLES `subscription_history` WRITE;
/*!40000 ALTER TABLE `subscription_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_payment_requests`
--

DROP TABLE IF EXISTS `subscription_payment_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_payment_requests` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `subscriptionId` varchar(36) NOT NULL,
  `email` varchar(180) NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'pending',
  `provider` varchar(16) NOT NULL,
  `tokenHash` varchar(128) NOT NULL,
  `amountEur` decimal(10,2) NOT NULL,
  `expiresAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `providerRef` varchar(120) DEFAULT NULL,
  `completedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_token` (`tokenHash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_payment_requests`
--

LOCK TABLES `subscription_payment_requests` WRITE;
/*!40000 ALTER TABLE `subscription_payment_requests` DISABLE KEYS */;
INSERT INTO `subscription_payment_requests` VALUES ('8ff23146-246a-4119-881d-c9311bbee5f9','1ed4bda3-1e79-41dd-9abb-025fb25cd760','28fd3f14-8f3a-4c22-b24f-e395bac7481b','tenientedan@tenientedan.com','pending','mock','bdcde9b95cc5c08519e4faf0d6155f6341cf16c56c154c92f8704a1c2a0da6bd',98.00,'2026-02-11 17:40:20',NULL,NULL,'2026-02-09 17:40:20');
/*!40000 ALTER TABLE `subscription_payment_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_services`
--

DROP TABLE IF EXISTS `subscription_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_services` (
  `id` varchar(36) NOT NULL,
  `subscriptionId` varchar(36) NOT NULL,
  `serviceCode` varchar(64) NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active',
  `activateAt` timestamp NULL DEFAULT NULL,
  `priceEur` decimal(10,2) NOT NULL DEFAULT 0.00,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deactivateAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subscription_service` (`subscriptionId`,`serviceCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_services`
--

LOCK TABLES `subscription_services` WRITE;
/*!40000 ALTER TABLE `subscription_services` DISABLE KEYS */;
INSERT INTO `subscription_services` VALUES ('8323b02b-aff9-485e-9cc8-64d1d44d5bdc','28fd3f14-8f3a-4c22-b24f-e395bac7481b','chat_generic','pending',NULL,49.00,'2026-02-09 17:40:20','2026-02-09 17:40:20',NULL);
/*!40000 ALTER TABLE `subscription_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'active',
  `period` varchar(16) NOT NULL DEFAULT 'monthly',
  `basePriceEur` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(3) NOT NULL DEFAULT 'EUR',
  `currentPeriodStart` timestamp NOT NULL DEFAULT current_timestamp(),
  `currentPeriodEnd` timestamp NOT NULL DEFAULT current_timestamp(),
  `cancelAtPeriodEnd` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subscription_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
INSERT INTO `subscriptions` VALUES ('28fd3f14-8f3a-4c22-b24f-e395bac7481b','1ed4bda3-1e79-41dd-9abb-025fb25cd760','pending','monthly',49.00,'EUR','2026-02-09 17:40:20','2026-03-09 17:40:20',0,'2026-02-09 17:40:20','2026-02-09 17:59:14');
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `key` varchar(64) NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES ('global_kill_switch','{\"enabled\":false}','2026-02-08 16:46:47');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_pricings`
--

DROP TABLE IF EXISTS `tenant_pricings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_pricings` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `pricingId` varchar(36) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_pricing` (`tenantId`,`pricingId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_pricings`
--

LOCK TABLES `tenant_pricings` WRITE;
/*!40000 ALTER TABLE `tenant_pricings` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenant_pricings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_services`
--

DROP TABLE IF EXISTS `tenant_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_services` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `genericEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `ocrEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `sqlEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_services_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_services`
--

LOCK TABLES `tenant_services` WRITE;
/*!40000 ALTER TABLE `tenant_services` DISABLE KEYS */;
INSERT INTO `tenant_services` VALUES ('35dacfae-27f0-4bc4-bf7a-3a1aa672341b','cfd55828-2f05-4b65-81b8-6dd0f051e57a',1,0,0,'2026-02-08 20:31:19','2026-02-08 20:31:19');
/*!40000 ALTER TABLE `tenant_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `killSwitch` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `billingEmail` varchar(180) DEFAULT NULL,
  `companyName` varchar(180) DEFAULT NULL,
  `contactName` varchar(180) DEFAULT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `addressLine1` varchar(180) DEFAULT NULL,
  `addressLine2` varchar(180) DEFAULT NULL,
  `city` varchar(120) DEFAULT NULL,
  `postalCode` varchar(20) DEFAULT NULL,
  `country` varchar(80) DEFAULT NULL,
  `billingAddressLine1` varchar(180) DEFAULT NULL,
  `billingAddressLine2` varchar(180) DEFAULT NULL,
  `billingCity` varchar(120) DEFAULT NULL,
  `billingPostalCode` varchar(20) DEFAULT NULL,
  `billingCountry` varchar(80) DEFAULT NULL,
  `taxId` varchar(40) DEFAULT NULL,
  `website` varchar(180) DEFAULT NULL,
  `authUsername` varchar(120) DEFAULT NULL,
  `authPasswordHash` varchar(255) DEFAULT NULL,
  `authMustChangePassword` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenants_auth_username` (`authUsername`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES ('096318e9-a284-4271-99f4-52353188126e','MyTennant','active',1,'2026-02-08 17:55:59','2026-02-09 13:42:13',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0),('100817db-5642-4173-b7aa-07751bbb0a45','Acme Demo','active',0,'2026-02-08 13:39:59','2026-02-08 13:39:59',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0),('1ed4bda3-1e79-41dd-9abb-025fb25cd760','r23r23','active',1,'2026-02-08 19:32:37','2026-02-09 17:39:27','tenientedan@tenientedan.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'tenientedan','90cc682985363596ac08dc52269d48269143add0f71e4074a45175af273a052c',0),('41813700-3306-456e-8bb0-210239e7709e','Teniente Dan','active',1,'2026-02-08 19:25:16','2026-02-08 19:25:16',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0),('7ca039ce-0f90-4392-b91d-4a43af3a8722','Chanante','active',0,'2026-02-08 19:38:36','2026-02-08 19:38:36',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0),('851746a0-f229-47f3-9644-cd5af0685b5e','Cliente Lol','active',1,'2026-02-08 19:22:36','2026-02-08 19:22:36',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0),('8b9c0116-52ff-472a-8f4e-c8e3b7066c45','cach','active',0,'2026-02-08 19:51:28','2026-02-08 19:51:28',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0),('cfd55828-2f05-4b65-81b8-6dd0f051e57a','mite','active',0,'2026-02-08 19:48:32','2026-02-08 19:48:32',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usage_events`
--

DROP TABLE IF EXISTS `usage_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usage_events` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `providerId` varchar(36) NOT NULL,
  `model` varchar(64) NOT NULL,
  `tokensIn` int(11) NOT NULL,
  `tokensOut` int(11) NOT NULL,
  `costUsd` decimal(10,6) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usage_events`
--

LOCK TABLES `usage_events` WRITE;
/*!40000 ALTER TABLE `usage_events` DISABLE KEYS */;
INSERT INTO `usage_events` VALUES ('35e2d1c5-a7b8-4d8a-8eae-55c6a6346c30','8b9c0116-52ff-472a-8f4e-c8e3b7066c45','ce188c7b-e779-4dfa-9b5c-9b399b090e12','gpt-4o-mini',8,9,0.026000,'2026-02-08 19:53:24'),('dfdcdd6e-9fa5-4d0f-8c0e-101f1fa5e4b2','8b9c0116-52ff-472a-8f4e-c8e3b7066c45','ce188c7b-e779-4dfa-9b5c-9b399b090e12','gpt-4o-mini',17,14,0.000000,'2026-02-08 21:08:33'),('eb2ffdbf-74ea-4ca8-9d86-a54657184997','100817db-5642-4173-b7aa-07751bbb0a45','584f8776-6c71-49fa-bb6e-38699a1ac326','mock-model',1200,640,0.000000,'2026-02-08 13:39:59');
/*!40000 ALTER TABLE `usage_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhooks`
--

DROP TABLE IF EXISTS `webhooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhooks` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(36) DEFAULT NULL,
  `url` varchar(255) NOT NULL,
  `events` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`events`)),
  `encryptedSecret` text DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhooks`
--

LOCK TABLES `webhooks` WRITE;
/*!40000 ALTER TABLE `webhooks` DISABLE KEYS */;
INSERT INTO `webhooks` VALUES ('752b3e8b-237b-4872-9a77-43b67533d0c0','100817db-5642-4173-b7aa-07751bbb0a45','https://example.com/webhook','[\"audit.event\"]',NULL,0,'2026-02-08 13:39:59','2026-02-08 13:39:59');
/*!40000 ALTER TABLE `webhooks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'provider_manager'
--

--
-- Dumping routines for database 'provider_manager'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-10  9:52:07
