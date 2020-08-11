-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 11, 2020 at 11:30 AM
-- Server version: 8.0.21
-- PHP Version: 7.3.21

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bankqeuing`
--

-- --------------------------------------------------------

--
-- Table structure for table `news`
--

DROP TABLE IF EXISTS `news`;
CREATE TABLE IF NOT EXISTS `news` (
  `newsID` bigint NOT NULL AUTO_INCREMENT,
  `newsHeadLine` varchar(100) DEFAULT NULL,
  `newsContent` text,
  `createdBy` bigint DEFAULT NULL,
  `createdOn` datetime DEFAULT NULL,
  PRIMARY KEY (`newsID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `playlists`
--

DROP TABLE IF EXISTS `playlists`;
CREATE TABLE IF NOT EXISTS `playlists` (
  `playID` bigint NOT NULL AUTO_INCREMENT,
  `playFilename` varchar(100) DEFAULT NULL,
  `playStatus` bit(1) DEFAULT NULL,
  `playSort` tinyint DEFAULT NULL,
  PRIMARY KEY (`playID`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `playlists`
--

INSERT INTO `playlists` (`playID`, `playFilename`, `playStatus`, `playSort`) VALUES
(1, 'vid1.mp4', b'1', 1),
(2, 'vid2.mp4', b'1', 2);

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
CREATE TABLE IF NOT EXISTS `transactions` (
  `trnID` bigint NOT NULL AUTO_INCREMENT,
  `trnNumber` int DEFAULT NULL,
  `trnTypeID` smallint DEFAULT NULL,
  `accName` varchar(100) DEFAULT NULL,
  `accNumber` varchar(50) DEFAULT NULL,
  `trnAmount` decimal(18,2) DEFAULT NULL,
  `trnTimeRequested` datetime DEFAULT NULL,
  `trnTimeServed` datetime DEFAULT NULL,
  `trnTellerServed` bigint DEFAULT NULL,
  PRIMARY KEY (`trnID`)
) ENGINE=MyISAM AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`trnID`, `trnNumber`, `trnTypeID`, `accName`, `accNumber`, `trnAmount`, `trnTimeRequested`, `trnTimeServed`, `trnTellerServed`) VALUES
(1, 1, 1, 'Romeo', '123123', '1200.00', '2020-08-08 23:59:55', NULL, NULL),
(2, 1, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 10:24:21', 1),
(3, 2, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 10:24:23', 2),
(4, 3, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 10:25:38', 1),
(5, 4, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 10:25:40', 2),
(6, 5, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 10:27:50', 2),
(7, 6, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 10:28:15', 1),
(8, 7, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 10:38:04', 2),
(9, 8, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 10:38:29', 1),
(10, 9, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 10:49:36', 4),
(11, 10, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 10:49:44', 4),
(12, 11, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 11:09:24', 4),
(13, 12, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 11:09:38', 2),
(14, 13, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', NULL, NULL),
(15, 14, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', NULL, NULL),
(16, 15, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', NULL, NULL),
(17, 16, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', NULL, NULL),
(18, 17, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', NULL, NULL),
(19, 18, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', NULL, NULL),
(20, 19, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', NULL, NULL),
(21, 20, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', NULL, NULL),
(22, 21, 1, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', NULL, NULL),
(23, 1, 2, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 10:27:27', 1),
(24, 2, 2, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', '2020-08-11 11:09:24', 4),
(25, 3, 2, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', NULL, NULL),
(26, 4, 2, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', NULL, NULL),
(27, 5, 2, 'Romeo', '123123', '1200.00', '2020-08-11 10:03:51', NULL, NULL),
(28, 22, 1, 'Adi', '34234234', '20000.00', '2020-08-11 10:40:02', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `trantypes`
--

DROP TABLE IF EXISTS `trantypes`;
CREATE TABLE IF NOT EXISTS `trantypes` (
  `trnTypeID` smallint NOT NULL,
  `trnTypeName` varchar(50) DEFAULT NULL,
  `trnTypePrefix` varchar(10) DEFAULT NULL,
  `trnTypeColor` varchar(10) DEFAULT NULL,
  `trnTypeSort` int DEFAULT NULL,
  PRIMARY KEY (`trnTypeID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `trantypes`
--

INSERT INTO `trantypes` (`trnTypeID`, `trnTypeName`, `trnTypePrefix`, `trnTypeColor`, `trnTypeSort`) VALUES
(1, 'Deposit', 'D', 'blue', 1),
(2, 'Withdraw', 'W', 'orange', 2);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `userID` bigint NOT NULL AUTO_INCREMENT,
  `userName` varchar(50) DEFAULT NULL,
  `userPassword` varchar(100) DEFAULT NULL,
  `userRoleName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`userID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
