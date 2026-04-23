# Dockerfile per backend Spring Boot (Java 17)
FROM eclipse-temurin:17-jdk-alpine as build
WORKDIR /app
COPY target/tenants-app-0.0.1-SNAPSHOT.jar app.jar

# Stage finale
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
# Modifica il nome jar se necessario
