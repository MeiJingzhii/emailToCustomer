/*
SQLyog Ultimate v12.08 (64 bit)
MySQL - 5.5.28 : Database - email
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`email` /*!40100 DEFAULT CHARACTER SET latin1 */;

USE `email`;

/*Table structure for table `send` */

DROP TABLE IF EXISTS `send`;

CREATE TABLE `send` (
  `id` int(5) NOT NULL,
  `company` varchar(50) CHARACTER SET utf8mb4 DEFAULT NULL,
  `email` varchar(50) CHARACTER SET utf8mb4 DEFAULT NULL,
  `first` varchar(50) DEFAULT NULL,
  `second` varchar(50) DEFAULT NULL,
  `third` varchar(50) DEFAULT NULL,
  `fourth` varchar(50) DEFAULT NULL,
  `fifth` varchar(50) DEFAULT NULL,
  `times` int(5) DEFAULT '0',
  `received` tinyint(2) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=gb2312;

/*Data for the table `send` */

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
