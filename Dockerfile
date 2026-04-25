# Dockerfile per backend Spring Boot (Java 17)
FROM maven:3.9.9-eclipse-temurin-17-alpine AS build
WORKDIR /workspace

ARG SPRING_PROFILES_ACTIVE=collaudo

COPY QTMCommonLib/pom.xml ./QTMCommonLib/
COPY QTMCommonLib/src ./QTMCommonLib/src
RUN mvn -f QTMCommonLib/pom.xml install -DskipTests=true

COPY Tenants-app/pom.xml ./Tenants-app/
COPY Tenants-app/src ./Tenants-app/src
RUN mvn -f Tenants-app/pom.xml package -DskipTests=true -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE}

# Stage finale
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/Tenants-app/target/tenants-app-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
